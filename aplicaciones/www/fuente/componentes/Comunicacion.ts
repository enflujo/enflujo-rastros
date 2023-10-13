function nuevoEvento(tipo: string) {
  return new CustomEvent('enflujo', {
    detail: { tipo },
  });
}

interface Mensaje {
  accion: 'bienvenido' | 'despedida';
}

interface Bienvenida extends Mensaje {
  id: string;
}
export default class Comunicacion {
  amigos: { [id: string]: string };
  conexion: WebSocket;
  id?: string;

  constructor() {
    this.amigos = {};
    const protocolo = window.location.protocol == 'https:' ? 'wss' : 'ws';
    this.conexion = new WebSocket(`${protocolo}://${window.location.hostname}:8000`);
    this.conexion.onopen = this.inicio;
    this.conexion.onmessage = this.recibiendoMensaje;
  }

  inicio() {
    window.dispatchEvent(nuevoEvento('conectado'));
  }

  recibiendoMensaje(evento: MessageEvent) {
    const datos: Bienvenida = JSON.parse(evento.data);

    if (datos.accion === 'bienvenido') {
      this.id = datos.id;
    } else if (datos.accion === 'despedida') {
      delete this.amigos[datos.id];
    }
  }
}
