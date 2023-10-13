import type { Acciones, TipoUsuario } from '@/tipos/compartidos';
import Amigo from 'simple-peer';

function nuevoEvento(tipo: string) {
  return new CustomEvent('enflujo', {
    detail: { tipo },
  });
}

interface Mensaje {
  accion: Acciones;
}

interface Bienvenido extends Mensaje {
  id: string;
  amigos?: {[id: string]: };
}

export default class Comunicacion {
  amigos: string[];
  conexion: WebSocket;
  id: string | null;
  tipo: TipoUsuario;

  constructor(tipo: TipoUsuario) {
    this.amigos = [];
    this.tipo = tipo;
    this.id = null;
    const protocolo = window.location.protocol == 'https:' ? 'wss' : 'ws';
    this.conexion = new WebSocket(`${protocolo}://${window.location.hostname}:8000?tipo=${tipo}`);
    this.conexion.onopen = this.inicio;
    this.conexion.onmessage = this.recibiendoMensaje;
    const yo = new Amigo();
  }

  inicio = () => {
    document.body.dispatchEvent(nuevoEvento('inicioConexion'));
  };

  recibiendoMensaje = (evento: MessageEvent) => {
    const datos: Bienvenido = JSON.parse(evento.data);

    switch (datos.accion) {
      case 'bienvenido':
        // El servidor crea un id único a cada usuario, acá nos llega el id que se le asigna a este usuario.
        this.id = datos.id;

        if (this.tipo === 'receptor' && datos.amigos) {
          this.amigos = datos.amigos;
        }
        document.body.dispatchEvent(nuevoEvento('bienvenido'));
        break;
      case 'despedida':
        // Acá nos llega el id del usuario que se acaba de desconectar para eliminarlo de la lista de amigos.
        delete this.amigos[datos.id];
        break;
      case 'nuevoAmigo':

      default:
        break;
    }
  };
}
