import { DrawingUtils } from '@mediapipe/tasks-vision';
import type { FaceLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { escalarLienzo } from './utilidades/ayudas';

export default class Vision {
  lienzo?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  pintor?: DrawingUtils;
  activo: boolean;
  modelo?: FaceLandmarker | HandLandmarker;

  constructor() {
    this.activo = false;
  }

  prender(camara: HTMLVideoElement) {
    this.lienzo = document.createElement('canvas');
    this.ctx = this.lienzo.getContext('2d') as CanvasRenderingContext2D;
    if (!this.pintor) this.pintor = new DrawingUtils(this.ctx);
    this.lienzo.className = 'lienzo';

    document.body.appendChild(this.lienzo);
    escalarLienzo(this.lienzo, this.ctx, camara);
    return this;
  }

  apagar() {
    if (!this.lienzo) return;
    document.body.removeChild(this.lienzo);
    delete this.pintor;
    delete this.lienzo;
    delete this.modelo;
  }
}
