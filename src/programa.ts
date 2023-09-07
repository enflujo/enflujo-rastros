import './scss/estilos.scss';
import voz from './voz';
import iris from './iris';
import caras from './caras';
import type { OpcionesCara } from './iris';

const vistas: { [nombre: string]: { prender: (config: any) => Promise<void>; apagar: () => void } } = {
  voice: voz,
  face: iris,
  hands: caras,
};

const opciones = document.querySelectorAll<HTMLInputElement>('#controles input');

const faceConfig: OpcionesCara = {
  background: { showVideo: false, color: '#1d1b1b', opacity: 0.01 },
  mesh: { show: true, width: 0.5, color: '#C0C0C070' },
  dots: { show: true, radius: 1.3, color: 'yellow' },
  rightEye: { show: false, width: 2, color: '#FF3030' },
  rightEyebrow: { show: true, width: 2, color: '#FF3030' },
  rightIris: { show: true, width: 2, color: '#FF3030' },
  leftEye: { show: false, width: 2, color: '#30FF30' },
  leftEyebrow: { show: true, width: 2, color: '#30FF30' },
  leftIris: { show: true, width: 2, color: '#30FF30' },
  lips: { show: true, width: 2, color: '#E0E0E0' },
  faceOval: { show: false, width: 2, color: '#E0E0E0' },
};

opciones.forEach((opcion) => {
  const aplicacion = vistas[opcion.id];
  const nombreAplicacion = opcion.id;
  const config = {};

  if (nombreAplicacion === 'face') {
    Object.assign(config, faceConfig);
  }

  if (opcion.checked) {
    aplicacion.prender(config).catch(console.error);
  }

  opcion.onchange = () => {
    if (opcion.checked) {
      aplicacion.prender(config).catch(console.error);
    } else {
      aplicacion.apagar();
    }
  };
});

// import caras from './caras';

// voz().catch(console.error);
// iris().catch(console.error);
