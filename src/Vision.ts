import { DrawingUtils } from '@mediapipe/tasks-vision';
import { escalarLienzo } from './utilidades/ayudas';

export default class Vision {
  lienzo: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  pintor: DrawingUtils;
  activo: boolean;

  constructor() {
    this.lienzo = document.createElement('canvas');
    this.ctx = this.lienzo.getContext('2d') as CanvasRenderingContext2D;
    this.pintor = new DrawingUtils(this.ctx);
    this.lienzo.className = 'lienzo';
    this.activo = false;
  }

  prender(camara: HTMLVideoElement) {
    document.body.appendChild(this.lienzo);
    escalarLienzo(this.lienzo, this.ctx, camara);
    return this;
  }

  apagar() {
    document.body.removeChild(this.lienzo);
  }
}
