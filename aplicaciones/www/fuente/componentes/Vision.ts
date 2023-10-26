import { DrawingUtils } from '@mediapipe/tasks-vision';
import { FaceLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { escalarLienzo } from '@/utilidades/ayudas';

export type TiposVision = 'caras' | 'manos';
export default class Vision {
  lienzo?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  pintor?: DrawingUtils;
  activo: boolean;
  modelo?: FaceLandmarker | HandLandmarker;
  tipo: TiposVision;

  constructor(tipo: TiposVision) {
    this.activo = false;
    this.tipo = tipo;
  }

  prender() {
    if (!this.lienzo) {
      this.lienzo = document.createElement('canvas');
      this.ctx = this.lienzo.getContext('2d') as CanvasRenderingContext2D;
      this.pintor = new DrawingUtils(this.ctx);
      this.lienzo.className = 'lienzo';

      escalarLienzo(this.lienzo, this.ctx);

      if (this.tipo === 'manos') {
        console.log('configurar manos');
        this.ctx.globalAlpha = 0.05;
        this.lienzo.style.zIndex = '2';
      }
    }

    document.body.appendChild(this.lienzo);

    return this;
  }

  apagar() {
    if (!this.lienzo) return;
    document.body.removeChild(this.lienzo);
    // delete this.pintor;
    // delete this.lienzo;
    // delete this.modelo;
  }
}
