import './scss/estilos.scss';
import voz from './voz';
import Caras from './Caras';
import Manos from './Manos';
import { iniciarCamara } from './utilidades/ayudas';
import { FilesetResolver } from '@mediapipe/tasks-vision';
import type { OpcionesCara } from './tipos';
import Vision from './Vision';

type Programas = {
  caras: Caras;
  manos: Manos;
};

const programas = { caras: new Caras(), manos: new Manos() };

const opciones = document.querySelectorAll<HTMLInputElement>('#controles input');
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
  const camara = (await iniciarCamara()) as HTMLVideoElement;

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  if (!camara || !vision) return;

  opciones.forEach((opcion) => {
    const programa = programas[opcion.id as keyof Programas];

    if (opcion.checked) {
      activarPrograma(programa);
    }

    opcion.onchange = () => {
      if (opcion.checked) {
        activarPrograma(programa);
      } else {
        programa.apagar();
        programa.activo = false;
      }
    };
  });

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

  function activarPrograma(programa: Caras | Manos) {
    if (programa instanceof Vision) {
      programa
        .prender(camara)
        .cargarModelo(vision)
        .then(() => {
          programa.activo = true;
        });
    }
  }
}

inicio();
