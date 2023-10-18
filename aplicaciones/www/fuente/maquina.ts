import '@/scss/maquina.scss';

import { FilesetResolver } from '@mediapipe/tasks-vision';
import Comunicacion from '@/componentes/Comunicacion';
import { escalarVideo, iniciarCamara } from './utilidades/ayudas';
import type { WasmFileset } from '@/tipos/www';
import { Acciones } from '@/tipos/compartidos';
import Caras from '@/componentes/Caras';
import Manos from '@/componentes/Manos';
import Voz from '@/componentes/Voz';
import AnalisisCara from '@/componentes/AnalisisCaras';
import Vision from '@/componentes/Vision';

const com = new Comunicacion('transmisor');
let reloj = -1;
let ultimoFotograma = -1;
let camara: HTMLVideoElement;
let modeloVision: WasmFileset;
// const lienzo = document.createElement('canvas');
// const ctx = lienzo.getContext('2d');
// document.body.appendChild(lienzo);
// lienzo.width = 320;
// lienzo.height = 180;

type Programas = {
  caras: Caras;
  manos: Manos;
  voz: Voz;
  analisisCara: AnalisisCara;
};

const programas: Programas = {
  caras: new Caras(),
  manos: new Manos(),
  voz: new Voz(),
  analisisCara: new AnalisisCara(),
};

const mensajeEstado = document.getElementById('mensajeEstado') as HTMLSpanElement;
const estadoTransmitiendo = document.getElementById('transmitiendo') as HTMLDivElement;

document.body.addEventListener('enflujo', (evento: CustomEventInit) => {
  switch (evento.detail.tipo as Acciones) {
    case 'inicioConexion':
      mensajeEstado.innerText = 'Connecting to server...';
      break;
    case 'bienvenida':
      mensajeEstado.innerText = `Successful connection to server with id: ${com.id}`;
      break;
    case 'iniciarTransmisor':
      mensajeEstado.innerText = `Initiating transmission...`;
      estadoTransmitiendo.className = 'iniciando';
      inicio().catch(console.error);
      break;
    case 'yaExisteTransmisor':
      mensajeEstado.innerText = `Sorry, there is already someone transmitting.`;
      break;
    default:
      break;
  }
});

async function inicio() {
  await activarPrograma(programas.caras);
  await activarPrograma(programas.manos);
  await activarPrograma(programas.voz);
  await activarPrograma(programas.analisisCara);

  ciclo();
  estadoTransmitiendo.className = 'prendido';
  mensajeEstado.innerText = `..:: Transmitting ::..`;
}

function ciclo() {
  if (!Object.keys(com.amigos).length) {
    reloj = requestAnimationFrame(ciclo);
    return;
  }
  // ctx?.drawImage(camara, 0, 0);
  const tiempoAhora = performance.now();

  if (camara.currentTime !== ultimoFotograma) {
    ultimoFotograma = camara.currentTime;

    const resultadoCaras = programas.caras.detectar(camara, tiempoAhora);
    const resultadoManos = programas.manos.detectar(camara, tiempoAhora);

    for (const id in com.amigos) {
      const amigo = com.amigos[id];

      if (resultadoCaras) {
        amigo.canal.send(JSON.stringify({ caras: resultadoCaras.faceLandmarks }));
      }

      if (resultadoManos) {
        amigo.canal.send(JSON.stringify({ manos: resultadoManos.landmarks }));
      }
    }
  }

  reloj = requestAnimationFrame(ciclo);
}

async function activarPrograma(programa: Caras | Manos | Voz | AnalisisCara) {
  if (programa instanceof Vision) {
    if (!camara) {
      camara = (await iniciarCamara()) as HTMLVideoElement;
      escalarVideo(camara);
    }

    if (!modeloVision) {
      modeloVision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
    }

    if (!camara || !modeloVision) return;

    await programa.cargarModelo(modeloVision);
    programa.activo = true;
  } else if (programa instanceof Voz || programa instanceof AnalisisCara) {
    // programa.prender();
  } else {
    console.error('No sé que programa cargar :(');
  }
}
