// import { PorterStemmer, SentimentAnalyzer } from 'natural';

// import { afinn165 } from "afinn-165";
import { polarity } from 'polarity';

// const analizador = new SentimentAnalyzer('English', PorterStemmer, 'afinn');

export default (texto: string) => {
  return polarity(texto.split(' '));

  // return analizador.getSentiment(texto.split(' '));
};

// afinn165;
