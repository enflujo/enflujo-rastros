import { DatosVoz } from '@/programa';
import { nuevoEventoEnFlujo } from '@/utilidades/ayudas';
import sentimientoVoz from '@/utilidades/sentimientoVoz';

const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
const Gramatica = window.SpeechGrammarList || window.webkitSpeechGrammarList;
const ReconocimientoEvento = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;
const sintetizador = window.speechSynthesis;

export default class Voz {
  ctx?: AudioContext;
  maquina?: SpeechRecognition;
  flujo?: MediaStream;
  fuente?: MediaStreamAudioSourceNode;
  analizador?: AnalyserNode;
  datos?: Float32Array;
  activo: boolean;
  textoEnVivo?: HTMLDivElement;
  archivo?: HTMLDivElement;
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
    this.ctx = new AudioContext();

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
    this.textoEnVivo = document.createElement('div');
    this.archivo = document.createElement('div');

    this.textoEnVivo.id = 'textoEnVivo';
    this.archivo.id = 'archivo';

    document.body.appendChild(this.archivo);
    document.body.appendChild(this.textoEnVivo);

    return this;
  }

  apagarModelo() {
    this.detener();
    delete this.ctx;
    delete this.flujo;
    window.cancelAnimationFrame(this.reloj);
  }

  apagar() {
    if (this.textoEnVivo) document.body.removeChild(this.textoEnVivo);
    if (this.archivo) document.body.removeChild(this.archivo);

    this.activo = false;
    this.sensibilidadMax = 0;
    this.hablando = false;
    this.reloj = 0;
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
    if (!this.textoEnVivo || !this.archivo) return;

    if (datos.tipo === 'textoVoz') {
      this.textoEnVivo.innerText = datos.datos;
    } else if (datos.tipo === 'datosVoz') {
      // this.textoEnVivo.innerText = '';
      // const frase = document.createElement('p');
      // frase.innerText = `(sentiment: ${JSON.stringify(datos.datos, null, 2)})`;
      // this.archivo.appendChild(frase);
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
