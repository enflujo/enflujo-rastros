// Copyright 2023 The MediaPipe Authors.

import { HandLandmarker } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { WasmFileset } from '@/tipos/www';
import Vision from '@/componentes/Vision';

export default class Manos extends Vision {
  constructor() {
    super();
  }

  async cargarModelo(vision: WasmFileset) {
    this.modelo = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/modelos/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 4,
    });
  }

  configurar() {
    if (!this.ctx || !this.lienzo) return;
    this.ctx.globalAlpha = 0.05;
    this.lienzo.style.zIndex = '2';
  }

  detectar(camara: HTMLVideoElement, tiempoAhora: number) {
    return (this.modelo as HandLandmarker).detectForVideo(camara, tiempoAhora);
  }

  pintar(puntos: NormalizedLandmark[][]) {
    if (!this.ctx || !this.pintor) return;

    if (puntos) {
      const pintor = this.pintor;
      for (const seccionMano of puntos) {
        pintor.drawConnectors(seccionMano, HandLandmarker.HAND_CONNECTIONS, {
          color: '#FBE7C6',
          lineWidth: 2,
        });

        pintor.drawLandmarks(seccionMano, { color: '#FBE7C6', radius: 1 });
      }
    }
  }
}
