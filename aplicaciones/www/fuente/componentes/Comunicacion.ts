import type { Acciones, TipoUsuario } from '@/tipos/compartidos';
import Amigo from 'simple-peer';
import type { Instance as InstanciaAmigo } from 'simple-peer';

function nuevoEvento(tipo: Acciones) {
  return new CustomEvent('enflujo', {
    detail: { tipo },
  });
}

interface Mensaje {
  accion: Acciones;
}

interface Bienvenido extends Mensaje {
  id: string;
  amigos?: string[];
}

export default class Comunicacion {
  amigos: { [id: string]: InstanciaAmigo };
  conexion: WebSocket;
  id: string | null;
  tipo: TipoUsuario;

  constructor(tipo: TipoUsuario) {
    this.amigos = {};
    this.tipo = tipo;
    this.id = null;
    const protocolo = window.location.protocol == 'https:' ? 'wss' : 'ws';
    this.conexion = new WebSocket(`${protocolo}://${window.location.hostname}:8000?tipo=${tipo}`);
    this.conexion.onopen = this.inicio;
    this.conexion.onmessage = this.recibiendoMensaje;
  }

  inicio = () => {
    document.body.dispatchEvent(nuevoEvento('inicioConexion'));
  };

  recibiendoMensaje = (evento: MessageEvent) => {
    const datos: Bienvenido = JSON.parse(evento.data);
    console.log(evento);
    switch (datos.accion) {
      case 'bienvenido':
        // El servidor crea un id único a cada usuario, acá nos llega el id que se le asigna a este usuario.
        this.id = datos.id;

        if (this.tipo === 'receptor' && datos.amigos) {
          // this.#hacerLlamada();
        }
        document.body.dispatchEvent(nuevoEvento('bienvenido'));
        break;
      case 'despedida':
        // Acá nos llega el id del usuario que se acaba de desconectar para eliminarlo de la lista de amigos.
        delete this.amigos[datos.id];
        break;
      case 'nuevoAmigo':
        break;
      case 'yaExisteTransmisor':
        document.body.dispatchEvent(nuevoEvento('yaExisteTransmisor'));
        break;

      default:
        break;
    }
  };

  #hacerLlamada() {
    try {
      const amigo = new Amigo({ initiator: this.tipo === 'transmisor' });

      amigo.on('signal', (datos) => {
        console.log(datos);
        // this.conexion.send(JSON.stringify({
        //   accion: ''
        // }))
      });
    } catch (error) {
      console.error('No se pudo iniciar conexión de WebRTC', error);
    }
  }

  // #enviarDatosAlServidor(datos) {
  //   this.conexion.send(JSON.stringify(datos));
  // }
}
