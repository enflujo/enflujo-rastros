import 'dotenv/config';
import fastify from 'fastify';
import WS from '@fastify/websocket';
import { v4 } from 'uuid';
import type WebSocket from 'ws';
import type { EventoRastros } from '@/tipos/compartidos';
import type { ParametrosInicio } from '@/tipos/servidor';

const aplicacion = fastify();
const usuariosConectados: { [id: string]: WebSocket } = {};
let transmisor: WebSocket | null;
let transmisorId: string | null;

aplicacion.register(WS);

function mensaje(obj: EventoRastros) {
  return JSON.stringify(obj);
}
const { PUERTO, NODE_ENV } = process.env;

const puerto = NODE_ENV === 'produccion' && PUERTO ? +PUERTO : 8000;

aplicacion.register(async (servidor) => {
  servidor.get<{ Querystring: ParametrosInicio }>('/:tipo', { websocket: true }, ({ socket: usuario }, peticion) => {
    const { tipo } = peticion.query;
    const id = v4();

    usuario.send(mensaje({ accion: 'bienvenida', id }));

    if (tipo) {
      if (tipo === 'transmisor') {
        if (!transmisor) {
          console.log('registrando nuevo transmisor');
          transmisor = usuario;
          transmisorId = id;
          usuario.send(mensaje({ accion: 'iniciarTransmisor' }));

          if (Object.keys(usuariosConectados).length) {
            for (const idAmigo in usuariosConectados) {
              usuariosConectados[idAmigo].send(mensaje({ accion: 'hayTransmisor', id: transmisorId }));
              transmisor.send(mensaje({ accion: 'llamarA', id: idAmigo }));
            }
          }
        } else {
          usuario.send(mensaje({ accion: 'yaExisteTransmisor' }));
        }
      } else if (tipo === 'receptor') {
        usuariosConectados[id] = usuario;

        // Revisar primero si el transmisor existe, de lo contrario avisarle al receptor que espere a que se conecte el transmisor.
        if (transmisor && transmisorId) {
          usuario.send(mensaje({ accion: 'iniciarReceptor', id: transmisorId }));
          transmisor.send(mensaje({ accion: 'llamarA', id }));
        } else {
          usuario.send(mensaje({ accion: 'esperarTransmision' }));
        }
      }
    }

    // Esperamos a que lleguen mensajes de este usuario.
    usuario.on('message', (datosMensaje) => {
      const datos = JSON.parse(datosMensaje.toString());

      switch (datos.accion) {
        case 'ofrecerSeñal':
          if (transmisor && datos.enviarA === transmisorId) {
            transmisor.send(mensaje({ accion: 'conectarSeñal', id, señal: datos.señal }));
          } else if (usuariosConectados.hasOwnProperty(datos.enviarA)) {
            usuariosConectados[datos.enviarA].send(mensaje({ accion: 'conectarSeñal', id, señal: datos.señal }));
          }

          break;
      }
    });

    usuario.on('close', () => {
      if (tipo === 'transmisor') {
        if (transmisorId === id) {
          transmisor = null;
          transmisorId = null;
          for (const id in usuariosConectados) {
            usuariosConectados[id].send(mensaje({ accion: 'sinTransmisor' }));
          }
        } else {
          console.log('se desconectó un fantasma que no hacía daño');
        }
      }

      if (tipo === 'receptor') {
        delete usuariosConectados[id];
        if (transmisor) transmisor.send(mensaje({ accion: 'despedida', id }));
      }
    });

    // Esperamos a ver si el usuario se desconecta.
    usuario.on('close', () => {
      // Por último eliminamos al usuario de la lista de usuarios conectados.
      delete usuariosConectados[id];
    });
  });
});

aplicacion.listen({ port: puerto }, (error, direccion) => {
  if (error) throw error;
  console.log('servidor en', direccion);
});
