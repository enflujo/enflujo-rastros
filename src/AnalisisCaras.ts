import type { Classifications } from '@mediapipe/tasks-vision';

let contenedor: HTMLDivElement;
let categorias: { contenedor: HTMLLIElement; barra: HTMLSpanElement; nombre: HTMLSpanElement }[] = [];
const contenedorParpadeos: HTMLDivElement = document.createElement('div');
const contenedorBesito: HTMLDivElement = document.createElement('div'); 
contenedorParpadeos.setAttribute('id', 'parpadeos');
contenedorParpadeos.innerText = '0';
contenedorBesito.setAttribute('id', 'besito');

let parpadeos = 0;
let parpadeando = false;
let besando = false;

export default class AnalisisCara {
  activo: boolean;

  constructor() {
    this.activo = false;
  }

  prender() {
    this.activo = true;
    contenedor = document.createElement('div');
    contenedor.setAttribute('id', 'contenedorAnalisisCaras');
    const formas = document.createElement('ul');

    for (let i = 0; i < 52; i++) {
      const li = document.createElement('li');
      const nombre = document.createElement('span');
      const barra = document.createElement('span');

      li.className = 'categoriaCara';
      nombre.className = 'nombre';
      barra.className = 'barra';

      li.appendChild(nombre);
      li.appendChild(barra);
      formas.appendChild(li);
      categorias.push({ contenedor: li, barra, nombre });
    }
    contenedor.appendChild(formas);

    document.body.appendChild(contenedorParpadeos);
    document.body.appendChild(contenedorBesito);
    document.body.appendChild(contenedor);
  }

  apagar() {
    document.body.removeChild(contenedor);
    document.body.removeChild(contenedorBesito);

    categorias = [];
    this.activo = false;
  }

  pintar(datos: Classifications[]) {
    if (!datos.length) return;

    datos[0].categories.forEach((categoria, i) => {
      categorias[i].nombre.innerText = categoria.categoryName;
      categorias[i].barra.style.width = `${categoria.score * 100}%`;

      if (categoria.categoryName === 'eyeBlinkLeft' || categoria.categoryName === 'eyeBlinkRight') {
        if (!parpadeando && categoria.score >= 0.5) {
          parpadeos += 1;
          parpadeando = true;

          setTimeout(() => {
            parpadeando = false;
          }, 300);

          contenedorParpadeos.innerText = `Blinked ${parpadeos} times.`;
        }
      }

      if (categoria.categoryName === 'mouthPucker') {

        if (!besando && categoria.score >= 0.8) {
         
          // besando = true;

          // setTimeout(() => {
          //   besando = false;
          // }, 300);

          contenedorBesito.innerText = 'Kiss me';
         
          
        }

        else {
          contenedorBesito.innerText = '';
        }
      }

      if(categoria.categoryName === 'mouthRight' && categoria.score >= 0.3) {
      contenedorBesito.style.left = `${50 + (Math.random() * 20)}vw`;
      contenedorBesito.style.top = `${50 + (Math.random() * 20)}vh`;
      }


      if(categoria.categoryName === 'mouthLeft' && categoria.score >= 0.3) {
        contenedorBesito.style.left = `${50 - (Math.random() * 20)}vw`;
        contenedorBesito.style.top = `${50 - (Math.random() * 20)}vh`;
      }

      


    });
  }
}
