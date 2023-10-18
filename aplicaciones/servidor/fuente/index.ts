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

aplicacion.register(async (servidor) => {
  servidor.get<{ Querystring: ParametrosInicio }>('/:tipo', { websocket: true }, ({ socket: usuario }, peticion) => {
    const { tipo } = peticion.query;
    const id = v4();

    usuariosConectados[id] = usuario;

    usuario.send(mensaje({ accion: 'bienvenida', id }));

    if (tipo) {
      if (tipo === 'transmisor') {
        if (!transmisor) {
          console.log('registrando nuevo transmisor');
          transmisor = usuario;
          transmisorId = id;
          usuario.send(mensaje({ accion: 'iniciarTransmisor' }));
        } else {
          usuario.send(mensaje({ accion: 'yaExisteTransmisor' }));
        }
      } else if (transmisor && tipo === 'receptor') {
        transmisor.send(mensaje({ accion: 'llamarA', id }));

        // Revisar primero si el transmisor existe, de lo contrario avisarle al receptor que espere a que se conecte el transmisor.
        if (transmisorId) {
          usuario.send(mensaje({ accion: 'iniciarReceptor', id: transmisorId }));
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
          if (!usuariosConectados.hasOwnProperty(datos.enviarA)) return;
          usuariosConectados[datos.enviarA].send(mensaje({ accion: 'conectarSeñal', id, señal: datos.señal }));
          break;
      }
    });

    usuario.on('close', () => {
      if (transmisor) {
        if (tipo === 'transmisor' && transmisorId === id) {
          console.log('Desconectando al transmisor');
          transmisor = null;
          transmisorId = null;
          for (const id in usuariosConectados) {
            usuariosConectados[id].send(mensaje({ accion: 'sinTransmisor' }));
          }
        } else if (tipo === 'transmisor') {
          console.log('se desconectó un fantasma que no hacía daño');
        } else {
          delete usuariosConectados[id];
          transmisor.send(mensaje({ accion: 'despedida', id }));
        }
      }
    });

    // Esperamos a ver si el usuario se desconecta.
    usuario.on('close', () => {
      // Por último eliminamos al usuario de la lista de usuarios conectados.
      delete usuariosConectados[id];
    });
  });
});

aplicacion.listen({ port: 8000 }, (error, direccion) => {
  if (error) throw error;
  console.log('servidor en', direccion);
});
