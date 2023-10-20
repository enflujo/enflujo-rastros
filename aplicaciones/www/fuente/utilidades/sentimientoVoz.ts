import { polarity } from 'polarity';

export default (texto: string) => {
  return polarity(texto.split(' '));
};
