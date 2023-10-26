import { DatosVoz } from '@/programa';
import { escalarLienzo, nuevoEventoEnFlujo } from '@/utilidades/ayudas';
import sentimientoVoz from '@/utilidades/sentimientoVoz';

const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
export default class Voz {
  lienzo?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  ctxA?: AudioContext;
  maquina?: SpeechRecognition;
  flujo?: MediaStream;
  fuente?: MediaStreamAudioSourceNode;
  analizador?: AnalyserNode;
  datos?: Float32Array;
  activo: boolean;
  textoEnVivo?: HTMLDivElement;
  sensibilidadMax: number;
  hablando: boolean;
  reloj: number;

  constructor() {
    this.activo = false;
    this.sensibilidadMax = 0;
    this.hablando = false;
    this.reloj = 0;
  }

  async cargarModelo() {
    this.ctxA = new AudioContext();

    try {
      this.maquina = new Reconocimiento();
      this.maquina.continuous = true;
      this.maquina.lang = 'en-US'; //'es-CO';
      this.maquina.interimResults = true;
      this.maquina.maxAlternatives = 1;
      this.maquina.start();
      await this.definirSensilidad();

      this.maquina.onend = () => {
        this.maquina?.start();
      };

      this.maquina.onresult = (evento) => {
        if (this.sensibilidadMax < 0) return;

        const resultado = evento.results[evento.results.length - 1];

        if (resultado.isFinal) {
          this.hablando = false;
          this.detener();
          this.sensibilidadMax = 0.0;
          this.procesarResultado(resultado[0].transcript, resultado.isFinal);
        } else if (!resultado.isFinal && !this.hablando) {
          this.hablando = true;
        }

        if (!resultado.isFinal && this.hablando) {
          let transcripcion = '';
          Object.keys(evento.results).forEach((llave) => {
            transcripcion += evento.results[+llave][0].transcript;
          });

          this.procesarResultado(transcripcion, resultado.isFinal);
        }
      };
    } catch (error) {
      console.error(error);
    }
  }

  async prender() {
    this.lienzo = document.createElement('canvas');
    this.ctx = this.lienzo.getContext('2d') as CanvasRenderingContext2D;
    this.lienzo.className = 'lienzo';

    escalarLienzo(this.lienzo, this.ctx);

    this.textoEnVivo = document.createElement('div');
    this.textoEnVivo.id = 'textoEnVivo';

    document.body.appendChild(this.textoEnVivo);
    document.body.appendChild(this.lienzo);

    return this;
  }

  apagarModelo() {
    this.detener();
    delete this.ctxA;
    delete this.flujo;
    if (this.lienzo) document.body.removeChild(this.lienzo);
  }

  apagar() {
    if (this.textoEnVivo) document.body.removeChild(this.textoEnVivo);

    this.activo = false;
    this.sensibilidadMax = 0;
    this.hablando = false;
    this.reloj = 0;
    window.cancelAnimationFrame(this.reloj);
  }

  detener() {
    this.maquina?.stop();
    this.flujo?.getTracks().forEach((track: MediaStreamTrack) => {
      track.stop();
      this.sensibilidadMax = 0.0;
    });
  }

  procesarResultado(transcripcion: string, yaTermino: boolean) {
    if (yaTermino) {
      const sentimiento = sentimientoVoz(transcripcion);
      nuevoEventoEnFlujo('datosVoz', JSON.stringify(sentimiento));
    } else {
      nuevoEventoEnFlujo('textoVoz', transcripcion);
    }
  }

  pintar(datos: DatosVoz) {
    if (!this.textoEnVivo) return;

    if (datos.tipo === 'textoVoz') {
      this.textoEnVivo.innerText = datos.datos;
    } else if (datos.tipo === 'datosVoz') {
      console.log(datos);
    }
  }

  async definirSensilidad() {
    this.flujo = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioContext = new AudioContext();
    const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(this.flujo);
    const analizador = audioContext.createAnalyser();
    mediaStreamAudioSourceNode.connect(analizador);

    const datosPcm = new Float32Array(analizador.fftSize);

    const instancia = () => {
      if (!this.flujo) return;

      analizador.getFloatTimeDomainData(datosPcm);
      let sumSquares = 0.0;

      for (const amplitud of datosPcm) {
        sumSquares += amplitud * amplitud;
      }

      const sensibilidad = Math.sqrt(sumSquares / datosPcm.length);
      if (sensibilidad > this.sensibilidadMax) this.sensibilidadMax = sensibilidad;
      this.reloj = window.requestAnimationFrame(instancia.bind(this));
    };

    this.reloj = window.requestAnimationFrame(instancia.bind(this));
  }
}
