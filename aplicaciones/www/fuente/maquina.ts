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
let camara: HTMLVideoElement;
let modeloVision: WasmFileset;
let reloj = -1;

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
const conteoAmigos = document.getElementById('conteoAmigos') as HTMLDivElement;

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
    case 'conectadoConTransmisor':
      console.log('conectado con transmisor');
      if (camara) {
        // Por alguna razón tenemos que cancelar el ciclo acá porque sino se detiene solo y nunca vuelve a revisar.
        if (reloj >= 0) camara.cancelVideoFrameCallback(reloj);

        reloj = camara.requestVideoFrameCallback(ciclo);
      }

      break;
    case 'amigosConectados':
      conteoAmigos.innerText = `${com.numeroAmigos}`;
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

  estadoTransmitiendo.className = 'prendido';
  mensajeEstado.innerText = `..:: Transmitting ::..`;
  reloj = camara.requestVideoFrameCallback(ciclo);
}

function ciclo(ahora: number) {
  if (com.tieneAmigos) {
    const resultadoCaras = programas.caras.detectar(camara, ahora);
    const resultadoManos = programas.manos.detectar(camara, ahora);

    for (const id in com.amigos) {
      const amigo = com.amigos[id];
      if (!amigo.canal.connected) return;

      if (resultadoCaras) {
        amigo.canal.send(JSON.stringify({ caras: resultadoCaras.faceLandmarks }));
      }

      if (resultadoManos) {
        amigo.canal.send(JSON.stringify({ manos: resultadoManos.landmarks }));
      }
    }
  }

  reloj = camara.requestVideoFrameCallback(ciclo);
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
