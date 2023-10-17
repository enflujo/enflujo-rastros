import '@/scss/maquina.scss';

import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';
import Vision from '@/componentes/Vision';
import Comunicacion from '@/componentes/Comunicacion';
import { iniciarCamara } from './utilidades/ayudas';
import type { WasmFileset } from '@/tipos/www';
import { Acciones } from '@/tipos/compartidos';

const com = new Comunicacion('transmisor');
let camara: HTMLVideoElement;
let modeloVision: WasmFileset;

document.body.addEventListener('enflujo', (evento) => {
  switch (evento.detail.tipo) {
    case 'bienvenido':
      console.log('Conectado, mi ID es:', com.id);
      inicio().catch(console.error);
      break;
    case 'inicioConexion':
      console.log('Iniciando conexión con el servidor');
      break;
    case ''
    default:
      break;
  }
});

async function inicio() {
  const camara = (await iniciarCamara()) as HTMLVideoElement;

  if (!modeloVision) {
    modeloVision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
  }
}
