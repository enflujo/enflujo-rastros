import { Classifications, DrawingUtils, FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { escalarLienzo, iniciarCamara } from './utilidades/ayudas';
interface ParametrosBase {
  show?: boolean;
  color?: string;
}

interface ParametrosLineas extends ParametrosBase {
  width?: number;
}

interface ParametrosPuntos extends ParametrosBase {
  radius?: number;
}

export type OpcionesCara = {
  background: { showVideo: boolean; color: string; opacity: number };
  mesh: ParametrosLineas;
  dots: ParametrosPuntos;
  rightEye: ParametrosLineas;
  rightEyebrow: ParametrosLineas;
  rightIris: ParametrosLineas;
  leftEye: ParametrosLineas;
  leftEyebrow: ParametrosLineas;
  leftIris: ParametrosLineas;
  lips: ParametrosLineas;
  faceOval: ParametrosLineas;
};

let lienzo: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let reloj = 0;

export default { prender, apagar };

async function prender({
  background,
  mesh,
  dots,
  rightEye,
  rightIris,
  rightEyebrow,
  leftEye,
  leftEyebrow,
  leftIris,
  lips,
  faceOval,
}: OpcionesCara) {
  const formas = document.createElement('ul');
  document.body.appendChild(formas);
  lienzo = document.createElement('canvas');
  lienzo.className = 'lienzo';
  ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
  document.body.appendChild(lienzo);

  const pintor = new DrawingUtils(ctx);
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );
  const cara = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: '/modelos/face_landmarker.task', delegate: 'GPU' },
    runningMode: 'VIDEO',
    outputFaceBlendshapes: true,
    numFaces: 1,
  });

  const camara = await iniciarCamara();
  if (!camara) return;

  escalarLienzo(lienzo, ctx, camara);

  let ultimoFotograma = -1;

  const ciclo = () => {
    if (!camara) return;
    const tiempoAhora = performance.now();

    if (camara.currentTime !== ultimoFotograma) {
      ultimoFotograma = camara.currentTime;

      const { faceLandmarks, faceBlendshapes } = cara.detectForVideo(camara, tiempoAhora);

      if (faceLandmarks) {
        if (background.showVideo) {
          ctx.drawImage(camara, 0, 0, camara.width, camara.height, 0, 0, lienzo.width, lienzo.height);
        } else {
          ctx.save();
          ctx.fillStyle = background.color || 'black';
          ctx.globalAlpha = background.opacity || 1;
          ctx.fillRect(0, 0, lienzo.width, lienzo.height);
          ctx.restore();
        }

        //
        for (const landmarks of faceLandmarks) {
          if (mesh.show) {
            pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
              color: mesh.color || '#C0C0C070',
              lineWidth: mesh.width || 0.5,
            });
          }

          if (dots.show) {
            pintor.drawLandmarks(landmarks, {
              lineWidth: 0.1,
              fillColor: dots.color || 'yellow',
              radius: dots.radius || 1.3,
            });
          }

          if (rightEye.show) {
            pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
              color: rightEye.color || '#FF3030',
              lineWidth: rightEye.width || 1,
            });
          }

          if (rightEyebrow.show) {
            pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, {
              color: rightEyebrow.color || '#FF3030',
              lineWidth: rightEyebrow.width || 1,
            });
          }

          if (rightIris.show) {
            pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, {
              color: rightIris.color || '#FF3030',
              lineWidth: rightIris.width || 1,
            });
          }

          if (leftEye.show) {
            pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
              color: leftEye.color || '#30FF30',
              lineWidth: leftEye.width || 1,
            });
          }

          if (leftEyebrow.show) {
            pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, {
              color: leftEyebrow.color || '#30FF30',
              lineWidth: leftEyebrow.width || 1,
            });
          }

          if (leftIris.show) {
            pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, {
              color: leftIris.color || '#30FF30',
              lineWidth: leftIris.width || 1,
            });
          }

          if (lips.show) {
            pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, {
              color: leftIris.color || '#E0E0E0',
              lineWidth: leftIris.width || 1,
            });
          }

          if (faceOval.show) {
            pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, {
              color: leftIris.color || '#E0E0E0',
              lineWidth: leftIris.width || 1,
            });
          }

          // pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_CONTOURS, { color: '#E0E0E0' });
        }

        // drawBlendShapes(faceBlendshapes);
      }
    }

    reloj = requestAnimationFrame(ciclo);
  };

  reloj = requestAnimationFrame(ciclo);

  function drawBlendShapes(blendShapes: Classifications[]) {
    if (!blendShapes.length) {
      return;
    }

    // console.log(blendShapes[0]);

    let htmlMaker = '';
    blendShapes[0].categories.map((forma) => {
      htmlMaker += `
        <li class="blend-shapes-item">
          <span class="blend-shapes-label">${forma.displayName || forma.categoryName}</span>
          <span class="blend-shapes-value" style="width: calc(${+forma.score * 100}% - 120px)">${(+forma.score).toFixed(
            4
          )}</span>
        </li>
      `;
    });

    formas.innerHTML = htmlMaker;
  }
}

function apagar() {
  window.cancelAnimationFrame(reloj);
  document.body.removeChild(lienzo);
}
