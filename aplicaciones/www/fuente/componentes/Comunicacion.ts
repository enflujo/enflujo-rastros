import type { EventoConectarSeñal, EventoMandarId, EventoRastros, TipoUsuario } from '@/tipos/compartidos';
import { nuevoEventoEnFlujo } from '@/utilidades/ayudas';
import Amigo from 'simple-peer';
import type { Instance, Options } from 'simple-peer';
// import SimplePeer from 'simple-peer';
const MAX_CHUNK_SIZE = 262144;
interface InstanciaAmigo extends Instance {
  _channel: RTCDataChannel | null;
  _pc: RTCPeerConnection;
}
// …

// class Peer extends SimplePeer {
//   webRTCPaused: boolean;
//   webRTCMessageQueue: string[];

//   constructor(opts: Options) {
//     super(opts);

//     this.webRTCPaused = false;
//     this.webRTCMessageQueue = [];
//   }

//   sendMessageQueued() {
//     this.webRTCPaused = false;

//     let message = this.webRTCMessageQueue.shift();

//     while (message) {
//       if (this._channel.bufferedAmount && this._channel.bufferedAmount > BUFFER_FULL_THRESHOLD) {
//         this.webRTCPaused = true;
//         this.webRTCMessageQueue.unshift(message);

//         const listener = () => {
//           this._channel.removeEventListener('bufferedamountlow', listener);
//           this.sendMessageQueued();
//         };

//         this._channel.addEventListener('bufferedamountlow', listener);
//         return;
//       }

//       try {
//         super.send(message);
//         message = this.webRTCMessageQueue.shift();
//       } catch (error) {
//         throw new Error(`Error send message, reason: ${error.name} - ${error.message}`);
//       }
//     }
//   }

//   send(chunk) {
//     this.webRTCMessageQueue.push(chunk);

//     if (this.webRTCPaused) {
//       return;
//     }

//     this.sendMessageQueued();
//   }
// }

const urlServidor = import.meta.env.DEV ? `${window.location.hostname}:8000` : 'rastros.enflujo.com/tally/';
// const urlServidor = 'rastros.enflujo.com/tally/';
const estadoInicialProgramas = { manos: false, caras: false, analisisCara: false, voz: false, datos: false };
export default class Comunicacion {
  amigos: {
    [id: string]: {
      canal: InstanciaAmigo;
      manos: boolean;
      caras: boolean;
      analisisCara: boolean;
      voz: boolean;
      datos: boolean;
    };
  };
  conexion: WebSocket;
  id: string | null;
  tipo: TipoUsuario;
  transmisor: InstanciaAmigo | null;
  tieneAmigos: boolean;
  numeroAmigos: number;

  constructor(tipo: TipoUsuario) {
    this.amigos = {};
    this.transmisor = null;
    this.tipo = tipo;
    this.id = null;
    this.tieneAmigos = false;
    this.numeroAmigos = 0;
    const protocolo = window.location.protocol == 'https:' ? 'wss' : 'ws';
    this.conexion = new WebSocket(`${protocolo}://${urlServidor}?tipo=${tipo}`);
    this.conexion.onopen = this.inicio;
    this.conexion.onmessage = this.recibiendoMensaje;
    this.conexion.onclose = this.chao;
    this.conexion.onclose = (error) => {
      console.error('Error en la conexión de WebSockets', error);
    };

    window.addEventListener('beforeunload', () => {
      this.conexion.close();
    });
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
        const d = datos as EventoConectarSeñal;

        if (this.tipo === 'transmisor') {
          if (this.amigos.hasOwnProperty(d.id)) {
            if (this.amigos[d.id].canal.connected) return;
            console.log('negociando señal');
            this.amigos[d.id].canal.signal(d.señal);
          }
        } else if (this.transmisor && this.tipo === 'receptor') {
          if (this.transmisor.connected) return;
          console.log('negociando señal desde receptor');
          this.transmisor.signal(d.señal);
        }

        break;
      case 'llamarA':
        console.log('Llamar a:', (datos as EventoMandarId).id);
        this.#hacerLlamada((datos as EventoMandarId).id, true);
        break;
      case 'despedida':
        this.#desconectarAmigo((datos as EventoMandarId).id);
        break;
      case 'yaExisteTransmisor':
        nuevoEventoEnFlujo('yaExisteTransmisor');
      case 'sinTransmisor':
        nuevoEventoEnFlujo('sinTransmisor');
        break;
      case 'hayTransmisor':
        console.log('ahora si hay transmisor con id', (datos as EventoMandarId).id);
        this.#hacerLlamada((datos as EventoMandarId).id, false);
        break;
      default:
        break;
    }
  };

  #desconectarAmigo(id: string) {
    const amigo = this.amigos[id];

    if (amigo) {
      console.log('Adios a:', id);
      amigo.canal.destroy();
      delete this.amigos[id];
    }

    this.#revisarNumeroAmigos();
  }

  #hacerLlamada(amigoId: string, iniciarLlamada: boolean) {
    const amigo: InstanciaAmigo = new Amigo({
      initiator: iniciarLlamada,
      // trickle: true,
    }) as InstanciaAmigo;

    if (iniciarLlamada) {
      this.transmisor = amigo;
    }

    amigo.on('signal', (señal) => {
      console.log('ofreciendo señal');
      this.#enviarDatosAlServidor({ accion: 'ofrecerSeñal', señal, enviarA: amigoId });
    });

    amigo.on('connect', () => {
      console.log('Conectado con:', amigoId);

      nuevoEventoEnFlujo('conectadoConTransmisor');
      this.#revisarNumeroAmigos();
    });

    amigo.on('close', () => {
      this.#desconectarAmigo(amigoId);
    });

    amigo.on('data', (mensaje) => {
      nuevoEventoEnFlujo('datos', mensaje.toString());
    });

    amigo.on('error', (err) => {
      console.error('Nuevo error', err);
    });

    // if (amigo._channel) {
    //   amigo._channel.onbufferedamountlow = (evento) => {
    //     console.log(evento);
    //   };
    // }

    amigo.on('end', () => {
      console.log('fin');
    });

    if (!iniciarLlamada) {
      this.transmisor = amigo;
    } else {
      this.amigos[amigoId] = { canal: amigo, ...estadoInicialProgramas };
    }
  }

  #enviarDatosAlServidor(datos: any) {
    this.conexion.send(JSON.stringify(datos));
  }

  #revisarNumeroAmigos() {
    const numeroAmigos = Object.keys(this.amigos).length;
    this.tieneAmigos = !!numeroAmigos;
    this.numeroAmigos = numeroAmigos;
    nuevoEventoEnFlujo('amigosConectados');
  }
}

// 16761614  con esto se llenó el canal
