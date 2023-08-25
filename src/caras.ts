import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow-models/face-detection';
import * as puntosCaras from '@tensorflow-models/face-landmarks-detection';
import type { Face } from '@tensorflow-models/face-landmarks-detection';
import { COLORES, DOS_PI, TOTAL_PUNTOS, TRIANGULACION } from './utilidades/constantes';
import { iniciarCamara } from './utilidades/ayudas';

export default async () => {
  const triangular = false;
  const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
  const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
  let reloj: number;
  const GREEN = '#32EEDB';
  const camara = await iniciarCamara();
  const model = puntosCaras.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig: puntosCaras.MediaPipeFaceMeshMediaPipeModelConfig = {
    runtime: 'mediapipe', // o 'tfjs'
    solutionPath: 'node_modules/@mediapipe/face_mesh', //
    refineLandmarks: true,
  };
  const detector = await puntosCaras.createDetector(model, detectorConfig);

  escalar();
  animar();

  async function detectarCaras() {
    if (!ctx || !camara) return;

    if (detector) {
      try {
        return await detector.estimateFaces(camara, { flipHorizontal: false });
      } catch (error) {
        detector.dispose();
        alert(error);
        return;
      }
    }
    return;
  }

  async function animar() {
    if (!camara) return;
    const caras = await detectarCaras();

    // Pintar video
    ctx.drawImage(camara, 0, 0, camara.videoWidth, camara.videoHeight);

    if (caras && caras.length > 0) {
      pintarCaras(caras);
    }

    reloj = requestAnimationFrame(animar);
  }

  function pintarForma(puntos: number[][], cerrar: boolean) {
    if (!ctx) return;

    const forma = new Path2D();
    forma.moveTo(puntos[0][0], puntos[0][1]);

    for (let i = 1; i < puntos.length; i++) {
      const punto = puntos[i];
      forma.lineTo(punto[0], punto[1]);
    }

    if (cerrar) {
      forma.closePath();
    }

    ctx.stroke(forma);
  }

  function pintarCaras(caras: Face[]) {
    if (!ctx) return;

    caras.forEach((face) => {
      const puntos = face.keypoints.map((keypoint) => [keypoint.x, keypoint.y]);

      if (triangular) {
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 0.5;

        for (let i = 0; i < TRIANGULACION.length / 3; i++) {
          const points = [TRIANGULACION[i * 3], TRIANGULACION[i * 3 + 1], TRIANGULACION[i * 3 + 2]].map(
            (index) => puntos[index]
          );

          pintarForma(points, true);
        }
      } else {
        ctx.fillStyle = GREEN;
        const radio = 1;

        for (let i = 0; i < TOTAL_PUNTOS; i++) {
          const x = puntos[i][0];
          const y = puntos[i][1];

          ctx.beginPath();
          ctx.arc(x, y, radio, 0, DOS_PI);
          ctx.fill();
        }
      }

      pintarContornos(puntos);
    });
  }

  function escalar() {
    if (!ctx || !camara) return;
    const videoWidth = camara.videoWidth;
    const videoHeight = camara.videoHeight;
    // Must set below two lines, otherwise video element doesn't show.
    camara.width = videoWidth;
    camara.height = videoHeight;

    lienzo.width = videoWidth;
    lienzo.height = videoHeight;

    // Because the image from camera is mirrored, need to flip horizontally.
    ctx.translate(camara.videoWidth, 0);
    ctx.scale(-1, 1);
  }

  function pintarContornos(puntos: number[][]) {
    if (!ctx) return;

    const contornos = puntosCaras.util.getKeypointIndexByContour(puntosCaras.SupportedModels.MediaPipeFaceMesh);

    for (const [nombre, contorno] of Object.entries(contornos)) {
      ctx.strokeStyle = COLORES[nombre];
      ctx.lineWidth = 3;
      const linea = contorno.map((index) => puntos[index]);

      if (linea.every((punto) => punto != undefined)) {
        pintarForma(linea, false);
      }
    }
  }
};
