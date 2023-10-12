import './scss/estilos.scss';
import Voz from './Voz';
import Caras from './Caras';
import Manos from './Manos';
import { iniciarCamara } from './utilidades/ayudas';
import { FaceLandmarkerResult, FilesetResolver } from '@mediapipe/tasks-vision';
import type { OpcionesCara, WasmFileset } from './tipos';
import Vision from './Vision';
import AnalisisCara from './AnalisisCaras';

type Programas = {
  caras: Caras;
  manos: Manos;
  voz: Voz;
  analisisCara: AnalisisCara;
};

const controlCara = document.getElementById('caras') as HTMLInputElement;
const controlManos = document.getElementById('manos') as HTMLInputElement;
const controlVoz = document.getElementById('voz') as HTMLInputElement;
const controlAnalisisCara = document.getElementById('analisisCara') as HTMLInputElement;
const contenedorParpadeo = document.getElementById('parpadeos');

const programas: Programas = {
  caras: new Caras(),
  manos: new Manos(),
  voz: new Voz(),
  analisisCara: new AnalisisCara(),
};
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

  if (controlAnalisisCara.checked) {
    await activarPrograma(programas.analisisCara);
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

  controlAnalisisCara.onchange = (evento: Event) => {
    if ((evento.target as HTMLInputElement).checked) {
      programas.analisisCara.prender();
    } else {
      programas.analisisCara.apagar();
    }
  };

  let ultimoFotograma = -1;

  function ciclo() {
    const tiempoAhora = performance.now();

    if (camara.currentTime !== ultimoFotograma) {
      ultimoFotograma = camara.currentTime;
      let resultadoCaras: FaceLandmarkerResult | undefined;

      if (programas.caras.activo) {
        resultadoCaras = programas.caras.detectar(camara, tiempoAhora);

        if (resultadoCaras) programas.caras.pintar(resultadoCaras.faceLandmarks, faceConfig);
      }

      if (programas.analisisCara.activo) {
        if (resultadoCaras) {
          programas.analisisCara.pintar(resultadoCaras.faceBlendshapes);
        } else {
          resultadoCaras = programas.caras.detectar(camara, tiempoAhora);
          if (resultadoCaras) programas.analisisCara.pintar(resultadoCaras.faceBlendshapes);
        }
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

  async function activarPrograma(programa: Caras | Manos | Voz | AnalisisCara) {
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
    } else {
      programa.prender();
    }
  }
}


function pintarRelaciones() {
  // const cajaParpadeo = contenedorParpadeo?.getBoundingClientRect;
   const contenedorTrazo =  document.createElementNS('http://www.w3.org/2000/svg', 'svg');
   const trazo = document.createElementNS('http://www.w3.org/2000/svg', 'path');

 //   if(cajaParpadeo) {
 //   trazo.setAttribute(
 //     'd',
 //     `M ${cajaLogo.right} ${cajaLogo.top + cajaLogo.height / 2} C ${cajaLogo.right} ${cajaGeneral.bottom + 200}, ${
 //       cajaGeneral.right * 0.9
 //     } ${cajaParpadeo.top}, ${cajaParpadeo?.right}, ${cajaParpadeo.bottom} `
 //   );
 // }


 trazo.setAttribute('d', 'M 70 110 C 70 140, 110 140, 110 110');
   trazo.setAttribute('stroke', '#5757f7');
   trazo.setAttribute('stroke-width', '5px');
   trazo.setAttribute('fill', 'transparent');

   contenedorTrazo.appendChild(trazo)
   document.body.appendChild(contenedorTrazo)
   

 }

inicio();