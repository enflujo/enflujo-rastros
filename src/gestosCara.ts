import '@mediapipe/face_detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as gestosCara from '@tensorflow-models/face-detection';
import { iniciarCamara } from './utilidades/ayudas';
import { loadGraphModel } from '@tensorflow/tfjs-converter';
import { Rank, Tensor, browser, expandDims, image } from '@tensorflow/tfjs-core';
type Emociones = 'angry' | 'disgust' | 'fear' | 'happy' | 'sad' | 'surprise' | 'neutral';
// const emotions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'];
export default async () => {
  const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });
  const camara = await iniciarCamara();
  const modelo = gestosCara.SupportedModels.MediaPipeFaceDetector;
  const configuracion: gestosCara.MediaPipeFaceDetectorMediaPipeModelConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
  };
  const detector = await gestosCara.createDetector(modelo, configuracion);
  const modeloEmociones = await loadGraphModel('/modelos/emociones.json');

  await modeloEmociones.load();
  console.log(modeloEmociones);
  let reloj: number;

  escalar();
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
    const caras = await detectarGestos();

    if (caras && caras.length) {
      for await (const cara of caras) {
        const { width, height, xMin: x, yMin: y } = cara.box;
        // console.log(cara);
        ctx?.drawImage(camara, 0, 0);
        ctx?.strokeRect(x, y, width, height);
        const recuadro = ctx?.getImageData(x, y, width, height);
        if (recuadro) {
          let tensor = browser.fromPixels(recuadro, 3);
          tensor = image.resizeBilinear(tensor, [64, 64]);
          tensor = image.rgbToGrayscale(tensor);
          tensor = expandDims(tensor, 0);
          const resultado = modeloEmociones.predict(tensor) as Tensor<Rank>;
          const puntajes = resultado.arraySync() as number[][];
          ctx?.save();
          ctx?.scale(-1, 1);
          const x = -200;
          ctx?.fillText('Angry ' + 100 * puntajes[0][0] + '%', x, 100);
          ctx?.fillText('Disgust ' + 100 * puntajes[0][1] + '%', x, 120);
          ctx?.fillText('Fear ' + 100 * puntajes[0][2] + '%', x, 140);
          ctx?.fillText('Happy ' + 100 * puntajes[0][3] + '%', x, 160);
          ctx?.fillText('Sad ' + 100 * puntajes[0][4] + '%', x, 180);
          ctx?.fillText('Surprise ' + 100 * puntajes[0][5] + '%', x, 200);
          ctx?.fillText('Neutral ' + 100 * puntajes[0][6] + '%', x, 220);
          console.log();
          ctx?.restore();
          tensor.dispose();
        }
      }
      // const cuadro = ctx.
      // const tensor = browser.fromPixels();
    }

    // const emociones = await modeloEmociones.predict(camara, )
    // const gestos = await detectarGestos();

    // Pintar video
    // ctx.drawImage(camara, 0, 0, camara.videoWidth, camara.videoHeight);

    // if (caras && caras.length > 0) {
    //   pintarCaras(caras);
    // }
    // console.log(gestos);
    reloj = requestAnimationFrame(animar);
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
};
