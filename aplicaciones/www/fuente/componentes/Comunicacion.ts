import type { EventoConectarSeñal, EventoMandarId, EventoRastros, TipoUsuario } from '@/tipos/compartidos';
import { nuevoEventoEnFlujo } from '@/utilidades/ayudas';
import Amigo from 'simple-peer';
import type { Instance as InstanciaAmigo } from 'simple-peer';

const estadoInicialProgramas = { manos: false, caras: false, analisisCara: false, voz: false };
export default class Comunicacion {
  amigos: { [id: string]: { canal: InstanciaAmigo; manos: boolean; caras: boolean; analisisCara: boolean } };
  conexion: WebSocket;
  id: string | null;
  tipo: TipoUsuario;
  transmisor: InstanciaAmigo | null;

  constructor(tipo: TipoUsuario) {
    this.amigos = {};
    this.transmisor = null;
    this.tipo = tipo;
    this.id = null;
    const protocolo = window.location.protocol == 'https:' ? 'wss' : 'ws';
    this.conexion = new WebSocket(`${protocolo}://${window.location.hostname}:8000?tipo=${tipo}`);
    this.conexion.onopen = this.inicio;
    this.conexion.onmessage = this.recibiendoMensaje;
    this.conexion.onclose = this.chao;
    this.conexion.onclose = (error) => {
      console.error('Error en la conexión de WebSockets', error);
    };
  }

  inicio = () => {
    nuevoEventoEnFlujo('inicioConexion');
  };

  chao = () => {
    this.conexion.send(JSON.stringify({ accion: 'chao', id: this.id }));
  };

  recibiendoMensaje = (evento: MessageEvent) => {
    const datos = JSON.parse(evento.data) as EventoRastros;

    switch (datos.accion) {
      case 'bienvenida':
        this.id = (datos as EventoMandarId).id;
        nuevoEventoEnFlujo('bienvenida');
        break;
      case 'iniciarTransmisor':
        nuevoEventoEnFlujo('iniciarTransmisor');
        break;
      case 'iniciarReceptor':
        this.#hacerLlamada((datos as EventoMandarId).id, false);
        break;
      case 'conectarSeñal':
        console.log('negociando señal');
        const d = datos as EventoConectarSeñal;
        if (this.amigos.hasOwnProperty(d.id)) {
          this.amigos[d.id].canal.signal(d.señal);
        }
        break;
      case 'llamarA':
        console.log('Llamar a:', (datos as EventoMandarId).id);
        this.#hacerLlamada((datos as EventoMandarId).id, true);
        break;
      case 'yaExisteTransmisor':
        nuevoEventoEnFlujo('yaExisteTransmisor');
      default:
        break;
    }
  };

  #hacerLlamada(amigoId: string, iniciarLlamada: boolean) {
    const amigo = new Amigo({
      initiator: iniciarLlamada,
      trickle: true,
    });

    amigo.on('signal', (señal) => {
      this.#enviarDatosAlServidor({ accion: 'ofrecerSeñal', señal, enviarA: amigoId });
    });

    amigo.on('connect', () => {
      console.log('Conectado con:', amigoId);
      nuevoEventoEnFlujo('conectadoConTransmisor');
    });

    amigo.on('close', () => {
      console.log('Cerro la señal', amigoId);
      amigo.destroy();
      delete this.amigos[amigoId];
    });

    amigo.on('data', (mensaje) => {
      nuevoEventoEnFlujo('datos', mensaje.toString());
    });

    amigo.on('error', (err) => {
      console.error('Nuevo error', err);
    });

    amigo.on('end', () => {
      console.log('fin');
    });

    this.amigos[amigoId] = { canal: amigo, ...estadoInicialProgramas };
  }

  #enviarDatosAlServidor(datos: any) {
    this.conexion.send(JSON.stringify(datos));
  }

  // #enviarDatosAlServidor(datos) {
  //   this.conexion.send(JSON.stringify(datos));
  // }
}
