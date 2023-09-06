import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow-models/face-detection';
import * as puntosCaras from '@tensorflow-models/face-landmarks-detection';
import type { Face } from '@tensorflow-models/face-landmarks-detection';
import { DOS_PI, TOTAL_PUNTOS, TRIANGULACION } from './utilidades/constantes';
import { iniciarCamara } from './utilidades/ayudas';

/**
 * Background configuration
 */
const mostrarVideo = false; // show video as background.
const colorFondo = 'tomato'; // applies if variable "mostrarVideo" is false.
const opacidadFondo = 0.1; // value from 0.0 to 1.0, paints the background color width alpha to leave a trail/ghost effect.
/**
 * Face Mesh configuration
 */
const triangular = false; // true shows mesh and false only shows dots.
const colorMalla = '#32EEDB'; // Color for the mesh lines (only if variable "triangular" is true).
const grosorLineaMalla = 0.5; // width of the mesh lines (only if variable "triangular" is true).

/**
 * Face Dots configuration (applies if variable "triangular" is set to false);
 */
const colorPuntos = '#FFF'; // Color of the dots.
const radioPunto = 0.01; // Radio or size of the dots in pixels.

/**
 * Face features contours configuration
 */
const partes: { [nombre: string]: { mostrar: boolean; color: string; ancho: number } } = {
  lips: { mostrar: false, color: '#E0E0E0', ancho: 2 },
  leftEye: { mostrar: true, color: '#30FF30', ancho: 1 },
  leftEyebrow: { mostrar: true, color: '#30FF30', ancho: 0.8 },
  leftIris: { mostrar: true, color: 'yellow', ancho: 2 },
  rightEye: { mostrar: true, color: '#FF3030', ancho: 1 },
  rightEyebrow: { mostrar: true, color: '#FF3030', ancho: 0.8 },
  rightIris: { mostrar: true, color: 'white', ancho: 2 },
  faceOval: { mostrar: false, color: '#E0E0E0', ancho: 0.01 },
};

export default async () => {
  const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
  const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
  let reloj: number;

  const camara = await iniciarCamara();
  const model = puntosCaras.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig: puntosCaras.MediaPipeFaceMeshMediaPipeModelConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
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

    if (mostrarVideo) {
      ctx.drawImage(camara, 0, 0, camara.videoWidth, camara.videoHeight);
    } else {
      ctx.save();
      ctx.fillStyle = colorFondo;
      ctx.globalAlpha = opacidadFondo;
      ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    }

    ctx.restore();
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

    caras.forEach((cara) => {
      const puntos = cara.keypoints.map(({ x, y }) => [x, y]);

      if (triangular) {
        ctx.strokeStyle = colorMalla;
        ctx.lineWidth = grosorLineaMalla;

        for (let i = 0; i < TRIANGULACION.length / 3; i++) {
          const puntosParteDelRostro = [TRIANGULACION[i * 3], TRIANGULACION[i * 3 + 1], TRIANGULACION[i * 3 + 2]].map(
            (index) => puntos[index]
          );

          pintarForma(puntosParteDelRostro, true);
        }
      } else {
        ctx.fillStyle = colorPuntos;

        for (let i = 0; i < TOTAL_PUNTOS; i++) {
          const x = puntos[i][0];
          const y = puntos[i][1];

          ctx.beginPath();
          ctx.arc(x, y, radioPunto, 0, DOS_PI);
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
    camara.width = videoWidth;
    camara.height = videoHeight;

    lienzo.width = videoWidth;
    lienzo.height = videoHeight;

    // Flip camera image horizontally.
    ctx.translate(camara.videoWidth, 0);
    ctx.scale(-1, 1);
  }

  function pintarContornos(puntos: number[][]) {
    if (!ctx) return;

    const contornos = puntosCaras.util.getKeypointIndexByContour(puntosCaras.SupportedModels.MediaPipeFaceMesh);

    for (const [nombre, contorno] of Object.entries(contornos)) {
      const parte = partes[nombre];
      ctx.strokeStyle = parte.color;
      ctx.lineWidth = parte.ancho;
      const linea = contorno.map((index) => puntos[index]);

      if (linea.every((punto) => punto != undefined)) {
        pintarForma(linea, false);
      }
    }
  }
};
