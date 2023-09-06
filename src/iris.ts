import { Classifications, DrawingUtils, FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { escalarLienzo, iniciarCamara } from './utilidades/ayudas';

export default async () => {
  const formas = document.createElement('ul');
  document.body.appendChild(formas);
  const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
  const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
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
  ciclo();

  function ciclo(): void {
    if (!camara) return;
    const tiempoAhora = performance.now();
    if (camara.currentTime !== ultimoFotograma) {
      ultimoFotograma = camara.currentTime;

      const { faceLandmarks, faceBlendshapes } = cara.detectForVideo(camara, tiempoAhora);
      // console.log(faceLandmarks);

      if (faceLandmarks) {
        ctx.fillRect(0, 0, lienzo.width, lienzo.height);
        // ctx.drawImage(camara, 0, 0);
        for (const landmarks of faceLandmarks) {
          pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
            color: '#C0C0C070',
            lineWidth: 0.5,
          });
          pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: '#FF3030' });
          pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: '#FF3030' });
          pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: '#30FF30' });
          pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: '#30FF30' });
          pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: '#E0E0E0' });
          pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: '#E0E0E0' });
          pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: '#FF3030' });
          pintor.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: '#30FF30' });
        }

        drawBlendShapes(faceBlendshapes);
      }
    }

    requestAnimationFrame(ciclo);
  }

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
};
