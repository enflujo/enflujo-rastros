export type TipoUsuario = 'transmisor' | 'receptor';

export type Acciones =
  | 'bienvenida'
  | 'iniciarTransmisor'
  | 'iniciarReceptor'
  | 'llamarA'
  | 'despedida'
  | 'yaExisteTransmisor'
  | 'inicioConexion'
  | 'sinTransmisor'
  | 'conectarSeñal'
  | 'esperarTransmision'
  | 'datos'
  | 'conectadoConTransmisor'
  | 'amigosConectados'
  | 'hayTransmisor';

export interface EventosRastrosBase {
  accion: Acciones;
}

export interface EventoMandarId extends EventosRastrosBase {
  id: string;
}

export interface EventoConectarSeñal {
  accion: 'conectarSeñal';
  id: string;
  señal: string;
}

export interface EventoDatos {
  accion: 'datos';
  datos: string;
}

export type EventoRastros = EventosRastrosBase | EventoMandarId | EventoConectarSeñal;
