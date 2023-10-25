import { EstructurasDatos } from '@/programa';

export type LlavesContenedoresDatos = 'caras' | 'manos' | 'analisisCara' | 'voz';

let contenedor: HTMLDivElement;

export default class FlujoDatos {
  activo: boolean;
  contenedores: { caras: HTMLDivElement; manos: HTMLDivElement; analisisCara: HTMLDivElement; voz: HTMLDivElement };

  constructor() {
    this.activo = false;
    this.contenedores = {
      caras: document.createElement('div'),
      manos: document.createElement('div'),
      analisisCara: document.createElement('div'),
      voz: document.createElement('div'),
    };
  }

  prender() {
    contenedor = document.createElement('div');
    contenedor.setAttribute('id', 'contenedorDatos');
    contenedor.appendChild(this.contenedores.caras);
    contenedor.appendChild(this.contenedores.manos);
    contenedor.appendChild(this.contenedores.analisisCara);
    contenedor.appendChild(this.contenedores.voz);
    document.body.appendChild(contenedor);

    this.activo = true;
  }

  apagar() {
    document.body.removeChild(contenedor);
    this.activo = false;
  }

  pintar(datos: EstructurasDatos) {
    const contenedores = this.contenedores;

    Object.keys(datos).forEach((llave) => {
      contenedores[llave as LlavesContenedoresDatos].innerText = JSON.stringify(datos);
    });
    // if (!datos.length) return;
    // datos[0].categories.forEach((categoria, i) => {
    //   categorias[i].nombre.innerText = categoria.categoryName;
    //   categorias[i].barra.style.width = `${categoria.score * 100}%`;
    //   if (categoria.categoryName === 'eyeBlinkLeft' || categoria.categoryName === 'eyeBlinkRight') {
    //     if (!parpadeando && categoria.score >= 0.5) {
    //       parpadeos += 1;
    //       parpadeando = true;
    //       setTimeout(() => {
    //         parpadeando = false;
    //       }, 300);
    //       contenedorParpadeos.innerText = `Blinked ${parpadeos} times.`;
    //       if (categoria.categoryName === 'eyeBlinkLeft') {
    //         this.pintarRelacion('eyeBlinkLeft', 'rgba(144, 39, 245, 0.15)');
    //       } else if (categoria.categoryName === 'eyeBlinkRight') {
    //         this.pintarRelacion('eyeBlinkRight', 'rgba(245, 39, 204, 0.25)');
    //       }
    //     }
    //   }
    // });
  }
}
