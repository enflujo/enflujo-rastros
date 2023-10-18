import sentimientoVoz from './utilidades/sentimientoVoz';

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
  lienzo?: HTMLCanvasElement;
  ctxDibujo?: CanvasRenderingContext2D;
  sentimiento: {polarity: number, positivity: number, negativity: number, positive: string[], negative: string[]};
  polaridad: number;
  

  constructor() {
    this.activo = false;
    this.sensibilidadMax = 0;
    this.hablando = false;
    this.reloj = 0;
    this.sentimiento = {polarity: 0, positivity: 0, negativity: 0, positive: [], negative: []};
    this.polaridad = 0;

    try {
      this.maquina = new Reconocimiento();
      this.maquina.continuous = true;
      this.maquina.lang = 'en-US'; //'es-CO';
      this.maquina.interimResults = true;
      this.maquina.maxAlternatives = 1;
    } catch (error) {
      console.error(error);
    }
  }

  async prender() {
    console.log('prendiendo');
    this.textoEnVivo = document.createElement('div');
    this.archivo = document.createElement('div');
    this.lienzo = document.createElement('canvas');
    this.ctxDibujo = this.lienzo.getContext('2d') as CanvasRenderingContext2D;
    this.lienzo.className = 'lienzoVoz';
    document.body.appendChild(this.lienzo);

    this.textoEnVivo.id = 'textoEnVivo';
    this.archivo.id = 'archivo';

    document.body.appendChild(this.archivo);
    document.body.appendChild(this.textoEnVivo);

    this.ctx = new AudioContext();

    if (!this.maquina) return;

    this.maquina.start();

    try {
      await this.definirSensilidad();
    } catch {}

    console.log('resultado');
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

    this.maquina.onend = () => {
      this.maquina?.start();
    };

    return this;
  }

  apagar() {
    this.detener();

    if (this.textoEnVivo) document.body.removeChild(this.textoEnVivo);
    if (this.archivo) document.body.removeChild(this.archivo);

    delete this.ctx;
    delete this.flujo;

    this.activo = false;
    this.sensibilidadMax = 0;
    this.hablando = false;
    this.reloj = 0;

    window.cancelAnimationFrame(this.reloj);

    if (!this.lienzo) return;
    document.body.removeChild(this.lienzo);
  }

  detener() {
    this.maquina?.stop();
    this.flujo?.getTracks().forEach((track: MediaStreamTrack) => {
      track.stop();
      this.sensibilidadMax = 0.0;
    });
  }

  procesarResultado(transcripcion: string, yaTermino: boolean) {
    if (!this.textoEnVivo || !this.archivo) return;

    this.textoEnVivo.innerText = transcripcion;
    if (yaTermino) {
      this.textoEnVivo.innerText = '';
      const frase = document.createElement('p');
      const sentimiento = sentimientoVoz(transcripcion);

      this.sentimiento = sentimiento;
      this.sentimiento.polarity += sentimiento.polarity
      console.log(this.sentimiento.polarity);

      frase.innerText = `${transcripcion} (sentiment: ${JSON.stringify(sentimiento, null, 2)})`;
      this.archivo.appendChild(frase);
      // archivo.scroll();
    }

    this.pintar();
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

  pintar() {
    if (this.ctxDibujo && this.lienzo) {
 
        // Start a new Path
        this.ctxDibujo.beginPath();
        this.ctxDibujo.moveTo(200, 200);
        this.trazarLinea(this.sentimiento.positivity, 10);

        console.log(this.sentimiento.polarity)

        // Draw the Path
        this.ctxDibujo.strokeStyle = `rgba(255, ${this.sentimiento.negativity*10}, ${this.sentimiento.positivity*10}, 0.5)`;
        this.ctxDibujo.stroke();
    }
  }
 
  trazarLinea(x:number, y:number) {
    this.ctxDibujo?.lineTo(x, y);
  }

}
