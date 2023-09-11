import './scss/estilos.scss';
import Voz from './Voz';
import Caras from './Caras';
import Manos from './Manos';
import { iniciarCamara } from './utilidades/ayudas';
import { FilesetResolver } from '@mediapipe/tasks-vision';
import type { OpcionesCara, WasmFileset } from './tipos';
import Vision from './Vision';

type Programas = {
  caras: Caras;
  manos: Manos;
  voz: Voz;
};

const controlCara = document.getElementById('caras') as HTMLInputElement;
const controlManos = document.getElementById('manos') as HTMLInputElement;
const controlVoz = document.getElementById('voz') as HTMLInputElement;
const programas: Programas = { caras: new Caras(), manos: new Manos(), voz: new Voz() };
let reloj = -1;

const faceConfig: OpcionesCara = {
  background: { showVideo: false, color: '#1d1b1b', opacity: 1 },
  mesh: { show: true, width: 0.5, color: '#C0C0C070' },
  dots: { show: true, radius: 1.3, color: 'yellow' },
  rightEye: { show: false, width: 2, color: '#FF3030' },
  rightEyebrow: { show: false, width: 2, color: '#FF3030' },
  rightIris: { show: false, width: 2, color: '#FF3030' },
  leftEye: { show: false, width: 2, color: '#30FF30' },
  leftEyebrow: { show: false, width: 2, color: '#30FF30' },
  leftIris: { show: false, width: 2, color: '#30FF30' },
  lips: { show: false, width: 2, color: '#E0E0E0' },
  faceOval: { show: false, width: 2, color: '#E0E0E0' },
};

async function inicio() {
  const eventoCambioEstadoVision = async (activo: boolean, llave: keyof Programas) => {
    const programa = programas[llave];

    if (activo) {
      await activarPrograma(programa);
    } else {
      programa.apagar();
      programa.activo = false;
    }
  };

  let camara: HTMLVideoElement;
  let modeloVision: WasmFileset;

  if (controlCara.checked) {
    await activarPrograma(programas.caras);
  }

  if (controlManos.checked) {
    await activarPrograma(programas.manos);
  }

  if (controlVoz.checked) {
    await activarPrograma(programas.voz);
  }

  controlCara.onchange = async (evento: Event) => {
    await eventoCambioEstadoVision((evento.target as HTMLInputElement).checked, 'caras');
  };

  controlManos.onchange = async (evento: Event) => {
    await eventoCambioEstadoVision((evento.target as HTMLInputElement).checked, 'manos');
  };

  controlVoz.onchange = async (evento: Event) => {
    if ((evento.target as HTMLInputElement).checked) {
      await activarPrograma(programas.voz);
    } else {
      programas.voz.apagar();
      programas.voz.activo = false;
    }
  };

  let ultimoFotograma = -1;

  function ciclo() {
    const tiempoAhora = performance.now();

    if (camara.currentTime !== ultimoFotograma) {
      ultimoFotograma = camara.currentTime;

      if (programas.caras.activo) {
        const resultadoCaras = programas.caras.detectar(camara, tiempoAhora);
        programas.caras.pintar(resultadoCaras.faceLandmarks, faceConfig);
      }

      if (programas.manos.activo) {
        const resultadoManos = programas.manos.detectar(camara, tiempoAhora);
        programas.manos.pintar(resultadoManos.landmarks);
      }

      // const { faceLandmarks, faceBlendshapes } = cara.detectForVideo(camara, tiempoAhora);
    }

    reloj = requestAnimationFrame(ciclo);
  }

  ciclo();

  async function activarPrograma(programa: Caras | Manos | Voz) {
    if (programa instanceof Vision) {
      if (!camara) {
        camara = (await iniciarCamara()) as HTMLVideoElement;
      }

      if (!modeloVision) {
        modeloVision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }

      if (!camara || !modeloVision) return;

      programa
        .prender(camara)
        .cargarModelo(modeloVision)
        .then(() => {
          programa.activo = true;
        });
    } else if (programa instanceof Voz) {
      programa.prender();
    }
  }
}

inicio();
