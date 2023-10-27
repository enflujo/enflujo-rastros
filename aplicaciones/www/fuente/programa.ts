import '@/scss/estilos.scss';
import Comunicacion from '@/componentes/Comunicacion';
import type { Acciones, LlavesProgramas } from '@/tipos/compartidos';
import type { OpcionesCara } from '@/tipos/www';
import Caras from '@/componentes/Caras';
import Manos from '@/componentes/Manos';
import Voz from '@/componentes/Voz';
import AnalisisCara from '@/componentes/AnalisisCaras';
import FlujoDatos from './componentes/FlujoDatos';
import type { LlavesContenedoresDatos } from './componentes/FlujoDatos';
import type { Classifications, NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Polarity } from 'polarity';

export type DatosVoz = {
  tipo: 'datosVoz';
  datos: Polarity;
};

export type DatosVozTexto = {
  tipo: 'textoVoz';
  datos: string;
};

export type EstructurasDatos = {
  caras?: NormalizedLandmark[][];
  manos?: NormalizedLandmark[][];
  analisisCara?: Classifications[];
  voz?: DatosVoz;
  datos?: LlavesContenedoresDatos;
};

type Programas = {
  caras: Caras;
  manos: Manos;
  voz: Voz;
  analisisCara: AnalisisCara;
  datos: FlujoDatos;
};

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
const controles = contenedorControles.querySelectorAll<HTMLInputElement>('.modelo input');
const activos = new Set<keyof Programas>();

const programas: Programas = {
  caras: new Caras(),
  manos: new Manos(),
  voz: new Voz(),
  analisisCara: new AnalisisCara(),
  datos: new FlujoDatos(),
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
      console.log('sin transmisor');
      break;

    case 'datos':
      const datos: EstructurasDatos = JSON.parse(evento.detail.datos);

      if (datos.caras && programas.caras.activo) {
        programas.caras.pintar(datos.caras, faceConfig);
      } else if (datos.analisisCara && programas.analisisCara.activo) {
        programas.analisisCara.pintar(datos.analisisCara);
      } else if (datos.manos && programas.manos.activo) {
        programas.manos.pintar(datos.manos);
      } else if (datos.voz && programas.voz.activo) {
        programas.voz.pintar(datos.voz);
      }

      if (programas.datos.activo) {
        programas.datos.pintar(datos);
      }

      break;

    default:
      break;
  }
});

async function inicio() {
  controles.forEach((control) => {
    const llave = control.id as LlavesProgramas;
    const programa = programas[llave];

    if (control.checked && !programa.activo) {
      programa.prender();
      programa.activo = true;
      activos.add(llave);
    }

    control.onchange = () => {
      if (programa.activo === control.checked) return;
      programa.activo = control.checked;

      if (control.checked) {
        programa.prender();
        activos.add(llave);
      } else {
        programa.apagar();
        activos.delete(llave);
      }

      if (com.transmisor) {
        com.transmisor.send(
          JSON.stringify({ accion: 'cambiarEstado', id: com.id, programa: llave, estado: control.checked })
        );
      }
    };
  });

  if (activos.size && com.transmisor) {
    com.transmisor.send(JSON.stringify({ accion: 'activarVarios', id: com.id, programas: Array.from(activos) }));
  }
}
