import { DatosVoz, DatosVozTexto } from '@/programa';
import { escalarLienzo, nuevoEventoEnFlujo } from '@/utilidades/ayudas';
import sentimientoVoz from '@/utilidades/sentimientoVoz';

const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;

export type HistoricoSentimientos = {
  negativo: number;
  positivo: number;
  polaridad: number;
};
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
  historico: number[];

  constructor() {
    this.activo = false;
    this.sensibilidadMax = 0;
    this.hablando = false;
    this.reloj = 0;
    this.historico = [];
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

    escalarLienzo(this.lienzo, this.ctx, false);
    this.ctx.font = '15px Arial';
    this.ctx.strokeStyle = 'yellow';
    this.ctx.fillStyle = 'yellow';
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
  }

  apagar() {
    if (this.textoEnVivo) document.body.removeChild(this.textoEnVivo);

    this.activo = false;
    this.sensibilidadMax = 0;
    this.hablando = false;
    this.reloj = 0;
    if (this.lienzo) document.body.removeChild(this.lienzo);
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
      nuevoEventoEnFlujo('datosVoz', sentimiento);
    } else {
      nuevoEventoEnFlujo('textoVoz', transcripcion);
    }
  }

  pintar(datos: DatosVoz | DatosVozTexto) {
    if (!this.textoEnVivo) return;

    if (datos.tipo === 'textoVoz') {
      this.textoEnVivo.innerText = datos.datos;
    } else if (datos.tipo === 'datosVoz') {
      const { polarity } = (datos as DatosVoz).datos;
      this.historico.push(polarity);
      this.actualizarDiagrama();
    }
  }

  actualizarDiagrama() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const datos = this.historico;
    const margen = 150;
    const ancho = window.innerWidth - margen * 2;
    const alto = window.innerHeight - margen * 2;
    const pasoX = ancho / datos.length;
    const pasoY = alto / 30;
    const y = window.innerHeight / 6;
    const ejeY = (valor: number) => valor * pasoY;
    // console.log('pasoX', pasoX);

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    // ctx.save();
    // ctx.strokeStyle = 'white';
    // ctx.beginPath();
    // ctx.moveTo(150, y);
    // ctx.lineTo(ancho, y);
    // // ctx.closePath();
    // ctx.stroke();
    // ctx.restore();

    datos.forEach((punto, i) => {
      const y2 = y - ejeY(punto);

      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(margen, y);
        ctx.lineTo(pasoX, y2);
        ctx.fillText(`${punto}`, pasoX, y2);
      } else {
        ctx.lineTo(i * pasoX, y2);
        ctx.fillText(`${punto}`, i * pasoX, y2);
      }

      // console.log(margen, y, i * pasoX, y2, punto);
    });

    ctx.stroke();
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
