import { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { OpcionesCara, WasmFileset } from './tipos';
import Vision from './Vision';

export default class Caras extends Vision {
  constructor() {
    super();
    // this.lienzo.style.zIndex = '1';
  }

  async cargarModelo(vision: WasmFileset) {
    this.modelo = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: '/modelos/face_landmarker.task', delegate: 'GPU' },
      runningMode: 'VIDEO',
      outputFaceBlendshapes: true,
      numFaces: 2,
    });

    if (!this.lienzo) return;
    this.lienzo.style.zIndex = '1';
  }

  detectar(camara: HTMLVideoElement, tiempoAhora: number) {
    return (this.modelo as FaceLandmarker).detectForVideo(camara, tiempoAhora);
  }

  pintar(puntos: NormalizedLandmark[][], configuracion: OpcionesCara) {
    if (!this.ctx || !this.pintor || !this.lienzo) return;

    if (puntos) {
      const ctx = this.ctx;
      const pintor = this.pintor;

      const {
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
      } = configuracion;

      ctx.save();
      ctx.fillStyle = background.color || 'black';
      ctx.globalAlpha = background.opacity || 1;
      ctx.fillRect(0, 0, this.lienzo.width, this.lienzo.height);
      ctx.restore();

      for (const seccionCara of puntos) {
        if (mesh.show) {
          pintor.drawConnectors(seccionCara, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
            color: mesh.color || '#C0C0C070',
            lineWidth: mesh.width || 0.5,
          });
        }

        if (dots.show) {
          pintor.drawLandmarks(seccionCara, {
            lineWidth: 0.1,
            fillColor: dots.color || 'yellow',
            radius: dots.radius || 1.3,
          });
        }

        if (rightEye.show) {
          pintor.drawConnectors(seccionCara, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
            color: rightEye.color || '#FF3030',
            lineWidth: rightEye.width || 1,
          });
        }

        if (rightEyebrow.show) {
          pintor.drawConnectors(seccionCara, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, {
            color: rightEyebrow.color || '#FF3030',
            lineWidth: rightEyebrow.width || 1,
          });
        }

        if (rightIris.show) {
          pintor.drawConnectors(seccionCara, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, {
            color: rightIris.color || '#FF3030',
            lineWidth: rightIris.width || 1,
          });
        }

        if (leftEye.show) {
          pintor.drawConnectors(seccionCara, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
            color: leftEye.color || '#30FF30',
            lineWidth: leftEye.width || 1,
          });
        }

        if (leftEyebrow.show) {
          pintor.drawConnectors(seccionCara, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, {
            color: leftEyebrow.color || '#30FF30',
            lineWidth: leftEyebrow.width || 1,
          });
        }

        if (leftIris.show) {
          pintor.drawConnectors(seccionCara, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, {
            color: leftIris.color || '#30FF30',
            lineWidth: leftIris.width || 1,
          });
        }

        if (lips.show) {
          pintor.drawConnectors(seccionCara, FaceLandmarker.FACE_LANDMARKS_LIPS, {
            color: leftIris.color || '#E0E0E0',
            lineWidth: leftIris.width || 1,
          });
        }

        if (faceOval.show) {
          pintor.drawConnectors(seccionCara, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, {
            color: leftIris.color || '#E0E0E0',
            lineWidth: leftIris.width || 1,
          });
        }

        // pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_CONTOURS, { color: '#E0E0E0' });
      }

      // drawBlendShapes(faceBlendshapes);
    }
  }
}

// async function prender() {
//   const formas = document.createElement('ul');
//   document.body.appendChild(formas);

//   function drawBlendShapes(blendShapes: Classifications[]) {
//     if (!blendShapes.length) {
//       return;
//     }

//     // console.log(blendShapes[0]);

//     let htmlMaker = '';
//     blendShapes[0].categories.map((forma) => {
//       htmlMaker += `
//         <li class="blend-shapes-item">
//           <span class="blend-shapes-label">${forma.displayName || forma.categoryName}</span>
//           <span class="blend-shapes-value" style="width: calc(${+forma.score * 100}% - 120px)">${(+forma.score).toFixed(
//             4
//           )}</span>
//         </li>
//       `;
//     });

//     formas.innerHTML = htmlMaker;
//   }
// }
