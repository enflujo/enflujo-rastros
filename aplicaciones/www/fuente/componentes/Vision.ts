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
    this.lienzo = document.createElement('canvas');
    this.ctx = this.lienzo.getContext('2d') as CanvasRenderingContext2D;
    if (!this.pintor) this.pintor = new DrawingUtils(this.ctx);
    this.lienzo.className = 'lienzo';

    document.body.appendChild(this.lienzo);
    escalarLienzo(this.lienzo, this.ctx);

    if (this.tipo === 'manos') {
      console.log('configurar manos');
      this.ctx.globalAlpha = 0.05;
      this.lienzo.style.zIndex = '2';
    }
    return this;
  }

  apagar() {
    if (!this.lienzo) return;
    document.body.removeChild(this.lienzo);
    delete this.pintor;
    // delete this.lienzo;
    // delete this.modelo;
  }
}
