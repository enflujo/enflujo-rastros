// Copyright 2023 The MediaPipe Authors.

import { HandLandmarker } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { WasmFileset } from './tipos';
import Vision from './Vision';

export default class Manos extends Vision {
  modelo?: HandLandmarker;

  constructor() {
    super();
    this.lienzo.style.zIndex = '2';
  }

  async cargarModelo(vision: WasmFileset) {
    this.modelo = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 4,
    });

    this.ctx.globalAlpha = 0.05;
  }

  detectar(camara: HTMLVideoElement, tiempoAhora: number) {
    return (this.modelo as HandLandmarker).detectForVideo(camara, tiempoAhora);
  }

  pintar(puntos: NormalizedLandmark[][]) {
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
