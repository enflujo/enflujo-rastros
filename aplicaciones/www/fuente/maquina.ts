import Comunicacion from '@/componentes/Comunicacion';

console.log('maquina');
const com = new Comunicacion('transmisor');

document.body.addEventListener('enflujo', (evento: CustomEventInit) => {
  switch (evento.detail.tipo) {
    case 'bienvenido':
      console.log('Conectado, mi ID es:', com.id);
      break;
    case 'inicioConexion':
      console.log('Iniciando conexión con el servidor');
      break;
    default:
      break;
  }
});
