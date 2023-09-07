import sentimientoVoz from './utilidades/sentimientoVoz';

const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
const Gramatica = window.SpeechGrammarList || window.webkitSpeechGrammarList;
const ReconocimientoEvento = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;
const sintetizador = window.speechSynthesis;

const config = {
  stt: {
    type: {
      title: 'Web Speech API',
      value: 'webspeech',
    },
    // language: 'en-US',
    language: 'es-MX',
    confidence: 0.9,
    sensitivity: 0.0,
  },
  tts: {
    enabled: false,
    type: {
      title: 'Web Speech API',
      value: 'webspeech',
    },
    voice: '',
    rate: 1,
    pitch: 1,
  },
};

const maquina = new Reconocimiento();
const textoEnVivo = document.createElement('div');
const archivo = document.createElement('div');

textoEnVivo.id = 'textoEnVivo';
archivo.id = 'archivo';
document.body.appendChild(archivo);
document.body.appendChild(textoEnVivo);

let flujo: MediaStream | null = null;
// const speechStore = useSpeechStore()

maquina.continuous = true;
maquina.lang = 'en-US'; //'es-CO';
maquina.interimResults = true;
maquina.maxAlternatives = 1;

let sensibilidad = 0.0;
let sensibilidadMax = 0.0;
let hablando = false;

async function definirSensilidad() {
  flujo = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  const audioContext = new AudioContext();
  const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(flujo);
  const analizador = audioContext.createAnalyser();
  mediaStreamAudioSourceNode.connect(analizador);

  const datosPcm = new Float32Array(analizador.fftSize);

  const instancia = () => {
    if (!flujo) return;

    analizador.getFloatTimeDomainData(datosPcm);
    let sumSquares = 0.0;

    for (const amplitud of datosPcm) {
      sumSquares += amplitud * amplitud;
    }

    sensibilidad = Math.sqrt(sumSquares / datosPcm.length);
    if (sensibilidad > sensibilidadMax) sensibilidadMax = sensibilidad;
    window.requestAnimationFrame(instancia);
  };

  window.requestAnimationFrame(instancia);
}

export default { prender, apagar };

async function prender() {
  maquina.start();

  try {
    await definirSensilidad();
  } catch {} // ios will deny the request on unsecure connections

  maquina.onresult = (evento) => {
    console.log(evento);
    if (sensibilidadMax < config.stt.sensitivity) return;

    const resultado = evento.results[evento.results.length - 1];

    if (resultado.isFinal) {
      hablando = false;
      detener();
      sensibilidadMax = 0.0;
      procesarResultado(resultado[0].transcript, resultado.isFinal);
    } else if (!resultado.isFinal && !hablando) {
      hablando = true;
    }

    if (!resultado.isFinal && hablando) {
      let transcripcion = '';
      Object.keys(evento.results).forEach((llave) => {
        transcripcion += evento.results[+llave][0].transcript;
      });

      procesarResultado(transcripcion, resultado.isFinal);
    }
  };
  maquina.onend = () => fin();
  maquina.onerror = (evento) => {
    console.error(evento);
  };
}

function detener() {
  maquina.stop();
  flujo?.getTracks().forEach((track: any) => {
    track.stop();
    flujo = null;
    sensibilidadMax = 0.0;
  });
}

function procesarResultado(transcripcion: string, yaTermino: boolean) {
  textoEnVivo.innerText = transcripcion;
  if (yaTermino) {
    textoEnVivo.innerText = '';
    const frase = document.createElement('p');
    const sentimiento = sentimientoVoz(transcripcion);

    frase.innerText = `${transcripcion} (sentiment: ${JSON.stringify(sentimiento, null, 2)})`;
    archivo.appendChild(frase);
    // archivo.scroll();
  }
}

function fin() {
  maquina.start();
}

function apagar() {}
