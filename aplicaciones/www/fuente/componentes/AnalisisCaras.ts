import type { Classifications } from '@mediapipe/tasks-vision';

let contenedor: HTMLDivElement;
let categorias: { contenedor: HTMLLIElement; barra: HTMLSpanElement; nombre: HTMLSpanElement }[] = [];
let contenedorParpadeos = document.createElement('div');

let parpadeos = 0;
let parpadeando = false;
let contenedorTrazo: SVGElement;

export default class AnalisisCara {
  activo: boolean;

  constructor() {
    this.activo = false;
  }

  prender() {
    this.activo = true;
    contenedor = document.createElement('div');
    contenedor.setAttribute('id', 'contenedorAnalisisCaras');
    contenedorParpadeos = document.createElement('div');
    contenedorParpadeos.setAttribute('id', 'parpadeos');
    contenedorTrazo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    contenedorTrazo.classList.add('contenedorTrazo');

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
    document.body.appendChild(contenedorTrazo);
  }

  apagar() {
    document.body.removeChild(contenedor);
    document.body.removeChild(contenedorParpadeos);
    document.body.removeChild(contenedorTrazo);

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

          if (categoria.categoryName === 'eyeBlinkLeft') {
            this.pintarRelacion('eyeBlinkLeft', 'rgba(144, 39, 245, 0.15)');
          } else if (categoria.categoryName === 'eyeBlinkRight') {
            this.pintarRelacion('eyeBlinkRight', 'rgba(245, 39, 204, 0.25)');
          }
        }
      }
    });
  }

  pintarRelacion(categoria: string, color: string) {
    const contenedorCategoria = document.getElementById(`${categoria}`);
    let cajaCategoria: DOMRect;
    let cajaParpadeo: DOMRect;

    if (contenedorCategoria && contenedorParpadeos) {
      const trazo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      cajaCategoria = contenedorCategoria?.getBoundingClientRect();
      cajaParpadeo = contenedorParpadeos?.getBoundingClientRect();

      trazo.setAttribute('stroke', `${color}`);
      trazo.setAttribute('stroke-width', '1px');
      trazo.setAttribute('fill', 'transparent');
      trazo.setAttribute(
        'd',
        `M ${cajaCategoria.right} ${cajaCategoria.bottom} C ${cajaParpadeo.left} ${cajaParpadeo.bottom + 200}, ${
          cajaParpadeo.left * 0.7
        } ${cajaParpadeo.top}, ${cajaParpadeo.left}, ${cajaParpadeo.bottom - cajaParpadeo.height / 2} `
      );
      contenedorTrazo.appendChild(trazo);
    }
  }
}
