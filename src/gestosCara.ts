import '@mediapipe/face_detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as gestosCara from '@tensorflow-models/face-detection';
import { iniciarCamara } from './utilidades/ayudas';

export default async () => {
  const camara = await iniciarCamara();
  const modelo = gestosCara.SupportedModels.MediaPipeFaceDetector;
  const configuracion: gestosCara.MediaPipeFaceDetectorMediaPipeModelConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',

    // or 'base/node_modules/@mediapipe/face_detection' in npm.
  };
  const detector = await gestosCara.createDetector(modelo, configuracion);
  let reloj: number;

  animar();

  async function detectarGestos() {
    if (!camara) return;
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
    const gestos = await detectarGestos();

    // Pintar video
    // ctx.drawImage(camara, 0, 0, camara.videoWidth, camara.videoHeight);

    // if (caras && caras.length > 0) {
    //   pintarCaras(caras);
    // }
    console.log(gestos);
    reloj = requestAnimationFrame(animar);
  }
};
