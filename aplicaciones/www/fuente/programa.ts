import '@/scss/estilos.scss';
import Comunicacion from '@/componentes/Comunicacion';
import type { Acciones } from '@/tipos/compartidos';
import type { OpcionesCara, Programas } from '@/tipos/www';
import Caras from '@/componentes/Caras';
import Manos from '@/componentes/Manos';
import Voz from '@/componentes/Voz';
import AnalisisCara from '@/componentes/AnalisisCaras';
// import Voz from '@/componentes/Voz';
// import Caras from '@/componentes/Caras';
// import Manos from '@/componentes/Manos';
// import { iniciarCamara } from '@/utilidades/ayudas';
// import { FaceLandmarkerResult, FilesetResolver } from '@mediapipe/tasks-vision';
// import type { OpcionesCara, Programas, WasmFileset } from '@/tipos/www';
// import Vision from '@/componentes/Vision';
// import AnalisisCara from '@/componentes/AnalisisCaras';

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

const menuBtn = document.getElementById('menu') as HTMLDivElement;
const contenedorControles = document.getElementById('controles') as HTMLDivElement;

const com = new Comunicacion('receptor');
const controlCara = document.getElementById('caras') as HTMLInputElement;
const controlManos = document.getElementById('manos') as HTMLInputElement;
const controlVoz = document.getElementById('voz') as HTMLInputElement;
const controlAnalisisCara = document.getElementById('analisisCara') as HTMLInputElement;

const programas: Programas = {
  caras: new Caras(),
  manos: new Manos(),
  voz: new Voz(),
  analisisCara: new AnalisisCara(),
};

menuBtn.onclick = () => {
  contenedorControles.classList.toggle('abierto');
};

document.body.onclick = (evento) => {
  if (evento.target === menuBtn) return;

  if (!(contenedorControles === evento.target || contenedorControles.contains(evento.target as Node))) {
    contenedorControles.classList.remove('abierto');
  }
};

document.body.addEventListener('enflujo', (evento: CustomEventInit) => {
  switch (evento.detail.tipo as Acciones) {
    case 'inicioConexion':
      console.log('Iniciando conexión con el servidor');
      break;
    case 'bienvenida':
      console.log('Conectado para recibir, mi ID es:', com.id);

      break;
    case 'conectadoConTransmisor':
      inicio().catch(console.error);
      break;
    case 'sinTransmisor':
      break;

    case 'datos':
      const datos = JSON.parse(evento.detail.datos);
      // console.log(datos);
      if (datos.caras) {
        programas.caras.pintar(datos.caras, faceConfig);
      }

      if (datos.manos) {
        programas.manos.pintar(datos.manos);
      }

      //
      break;

    default:
      break;
  }
});

const eventoCambioEstadoVision = async (activo: boolean, llave: keyof Programas) => {
  const programa = programas[llave];

  if (activo) {
    programa.activo = true;
  } else {
    programa.apagar();
    programa.activo = false;
  }
};

async function inicio() {
  if (controlCara.checked) {
    programas.caras.prender();
    programas.caras.activo = true;
  }

  if (controlManos.checked) {
    programas.manos.prender();
    programas.manos.configurar();
    programas.manos.activo = true;
  }

  if (controlVoz.checked) {
    programas.voz.prender();
    programas.voz.activo = true;
  }

  if (controlAnalisisCara.checked) {
    programas.analisisCara.prender();
    programas.analisisCara.activo = true;
  }
}

// const programas: Programas = {
//   caras: new Caras(),
//   manos: new Manos(),
//   voz: new Voz(),
//   analisisCara: new AnalisisCara(),
// };

// let reloj = -1;

// async function inicio() {

//   let camara: HTMLVideoElement;
//   let modeloVision: WasmFileset;

//   controlCara.onchange = async (evento: Event) => {
//     await eventoCambioEstadoVision((evento.target as HTMLInputElement).checked, 'caras');
//   };

//   controlManos.onchange = async (evento: Event) => {
//     await eventoCambioEstadoVision((evento.target as HTMLInputElement).checked, 'manos');
//   };

//   controlVoz.onchange = async (evento: Event) => {
//     if ((evento.target as HTMLInputElement).checked) {
//       await activarPrograma(programas.voz);
//     } else {
//       programas.voz.apagar();
//       programas.voz.activo = false;
//     }
//   };

//   controlAnalisisCara.onchange = (evento: Event) => {
//     if ((evento.target as HTMLInputElement).checked) {
//       programas.analisisCara.prender();
//     } else {
//       programas.analisisCara.apagar();
//     }
//   };

//   let ultimoFotograma = -1;

//   function ciclo() {
//     const tiempoAhora = performance.now();

//     if (camara.currentTime !== ultimoFotograma) {
//       ultimoFotograma = camara.currentTime;
//       let resultadoCaras: FaceLandmarkerResult | undefined;

//       if (programas.caras.activo) {
//         resultadoCaras = programas.caras.detectar(camara, tiempoAhora);

//         if (resultadoCaras) programas.caras.pintar(resultadoCaras.faceLandmarks, faceConfig);
//       }

//       if (programas.analisisCara.activo) {
//         if (resultadoCaras) {
//           programas.analisisCara.pintar(resultadoCaras.faceBlendshapes);
//         } else {
//           resultadoCaras = programas.caras.detectar(camara, tiempoAhora);
//           if (resultadoCaras) programas.analisisCara.pintar(resultadoCaras.faceBlendshapes);
//         }
//       }

//       if (programas.manos.activo) {
//         const resultadoManos = programas.manos.detectar(camara, tiempoAhora);
//         programas.manos.pintar(resultadoManos.landmarks);
//       }
//     }

//     reloj = requestAnimationFrame(ciclo);
//   }

//   ciclo();

//   async function activarPrograma(programa: Caras | Manos | Voz | AnalisisCara) {
//     if (programa instanceof Vision) {
//       if (!camara) {
//         camara = (await iniciarCamara()) as HTMLVideoElement;
//       }

//       if (!modeloVision) {
//         modeloVision = await FilesetResolver.forVisionTasks(
//           'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
//         );
//       }

//       if (!camara || !modeloVision) return;

//       programa
//         .prender(camara)
//         .cargarModelo(modeloVision)
//         .then(() => {
//           programa.activo = true;
//         });
//     } else if (programa instanceof Voz) {
//       programa.prender();
//     } else {
//       programa.prender();
//     }
//   }
// }

// inicio();
