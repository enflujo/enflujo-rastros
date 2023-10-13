import type { Classifications } from '@mediapipe/tasks-vision';

let contenedor: HTMLDivElement;
let categorias: { contenedor: HTMLLIElement; barra: HTMLSpanElement; nombre: HTMLSpanElement }[] = [];
const contenedorParpadeos = document.createElement('div');
contenedorParpadeos.setAttribute('id', 'parpadeos');
contenedorParpadeos.innerText = '0';
let parpadeos = 0;
let parpadeando = false;

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
    document.body.appendChild(contenedor);
  }

  apagar() {
    document.body.removeChild(contenedor);
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
    });
  }
}
