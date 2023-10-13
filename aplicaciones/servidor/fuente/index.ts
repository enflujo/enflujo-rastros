import fastify from 'fastify';
import WS from '@fastify/websocket';
import { v4 } from 'uuid';
import WebSocket from 'ws';
import type { TipoUsuario } from '@/tipos/compartidos';

const aplicacion = fastify();
const usuariosConectados: { [id: string]: WebSocket } = {};
let transmisor: { [id: string]: WebSocket } = {};

aplicacion.register(WS);

interface ParametrosInicio {
  tipo: TipoUsuario;
}

function mensaje(obj: { accion: string; [llave: string]: any }) {
  return JSON.stringify(obj);
}

aplicacion.register(async (servidor) => {
  servidor.get<{ Querystring: ParametrosInicio }>('/:tipo', { websocket: true }, ({ socket: usuario }, peticion) => {
    const { tipo } = peticion.query;
    const id = v4();

    if (tipo) {
      if (tipo === 'transmisor') {
        if (!transmisor) {
          transmisor = {};
          transmisor[id] = usuario;
          usuario.send(mensaje({ accion: 'bienvenido', id }));
        } else {
          usuario.send(mensaje({ accion: 'yaExisteTransmisor' }));
        }
      } else if (tipo === 'receptor') {
        usuariosConectados[id] = usuario;
        const transmisorActual = Object.keys(transmisor);
        usuario.send(mensaje({ accion: 'bienvenido', id, transmisor: transmisorActual ? transmisorActual[0] : null }));
      }
    }

    console.log('nuevo usuario');
    usuario.on('message', (mensaje) => {
      console.log(mensaje.toString());
    });

    usuario.on('close', () => {
      delete usuariosConectados[id];

      for (const id in usuariosConectados) {
        usuariosConectados[id].send(mensaje({ accion: 'despedida', id }));
      }
    });
  });
});

aplicacion.listen({ port: 8000 }, (error, direccion) => {
  if (error) throw error;
  console.log('servidor en', direccion);
});
