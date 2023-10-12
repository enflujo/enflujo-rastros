import fastify from 'fastify';
import WS from '@fastify/websocket';
import { v4 } from 'uuid';

const aplicacion = fastify();
const usuariosConectados: { [id: string]: WebSocket } = {};

aplicacion.register(WS);

aplicacion.register(async (servidor) => {
  servidor.get('/', { websocket: true }, ({ socket: usuario }, peticion) => {
    console.log('nuevo usuario');
    const id = v4();

    // usuariosConectados[id] = usuario;

    usuario.send(JSON.stringify({ accion: 'bienvenido', id }));

    usuario.on('message', (mensaje) => {
      console.log(mensaje.toString());
    });

    usuario.on('close', () => {
      delete usuariosConectados[id];

      for (const id in usuariosConectados) {
        usuariosConectados[id].send(JSON.stringify({ accion: 'despedida', id }));
      }
    });
  });
});

aplicacion.listen({ port: 8000 }, (error, direccion) => {
  if (error) throw error;
  console.log('servidor en', direccion);
});
