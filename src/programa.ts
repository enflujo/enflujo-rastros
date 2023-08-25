import './scss/estilos.scss';

// import Human from '@vladmandic/human';
// import { iniciarCamara } from './utilidades/ayudas';

import caras from './caras';
import gestosCara from './gestosCara';

// caras();
gestosCara();

// // console.log('..:: EnFlujo ::..');

// iniciarCamara().then(async (camara) => {
//   if (!camara) return;
//   // escalar();
//   const human = new Human({
//     backend: 'webgl',
//     gesture: { enabled: false },
//     face: {
//       detector: { maxDetected: 3 },
//       // mesh: { enabled: false },
//       attention: { enabled: false },
//       iris: { enabled: false },
//       description: { enabled: false },
//       antispoof: { enabled: false },
//       liveness: { enabled: false },
//     },
//     body: { enabled: false },
//     hand: { enabled: false },
//     object: { enabled: false },
//     segmentation: { enabled: false },
//   });

//   // // select input HTMLVideoElement and output HTMLCanvasElement from page
//   const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
//   const ctx = lienzo.getContext('2d');
//   if (!lienzo) return;
//   escalar();
//   // lienzo.width = camara.videoWidth;
//   // lienzo.height = camara.videoHeight;

//   function detectVideo() {
//     if (!camara) return;
//     human.detect(camara).then((result) => {
//       // console.log(result);
//       if (!ctx) return;

//       ctx.fillStyle = 'rgba(0,0,0,0.8)';
//       // ctx.fillRect(0, 0, lienzo.width, lienzo.height);
//       if (!result) return;
//       if (!result.canvas) return;
//       const personas = result.persons;

//       if (personas.length) {
//         for (let i = 0; i < personas.length; i++) {
//           const emociones = personas[0].face.emotion;

//         }
//       }
//       console.log(result);
//       human.draw.canvas(result.canvas, lienzo);
//       // then draw results on the same canvas
//       // human.draw.face(lienzo, result.face);
//       // human.draw.body(lienzo, result.body);
//       // human.draw.hand(lienzo, result.hand);
//       // human.draw.gesture(lienzo, result.gesture);
//       // and loop immediate to the next frame
//       requestAnimationFrame(detectVideo);
//       return result;
//     });
//   }

//   detectVideo();

//   function escalar() {
//     if (!ctx || !camara) return;
//     const videoWidth = camara.videoWidth;
//     const videoHeight = camara.videoHeight;
//     camara.width = videoWidth;
//     camara.height = videoHeight;
//     lienzo.width = videoWidth;
//     lienzo.height = videoHeight;
//     ctx.translate(camara.videoWidth, 0);
//     ctx.scale(-1, 1);
//   }
// });

// // const human = new Human(); // create instance of Human

// // async function drawResults() {
// //   const interpolated = human.next(); // get smoothened result using last-known results
// //   human.draw.all(lienzo, interpolated); // draw the frame
// //   console.log(interpolated);
// //   requestAnimationFrame(drawResults); // run draw loop
// // }

// // human.video(camara); // start detection loop which continously updates results
// // drawResults(); // start draw loop

// function setText(text: string) {
//   document.getElementById('status').innerText = text;
// }

// function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
//   ctx.beginPath();
//   ctx.moveTo(x1, y1);
//   ctx.lineTo(x2, y2);
//   ctx.stroke();
// }

// const emotions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'];
// let emotionModel = null;

// let output = null;
// let model = null;

// async function trackFace() {
//   const video = document.querySelector('video');
//   const faces = await model.estimateFaces({
//     input: video,
//     returnTensors: false,
//     flipHorizontal: false,
//   });
//   output.drawImage(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);

//   let points = null;
//   faces.forEach((face) => {
//     // Draw the bounding box
//     const x1 = face.boundingBox.topLeft[0];
//     const y1 = face.boundingBox.topLeft[1];
//     const x2 = face.boundingBox.bottomRight[0];
//     const y2 = face.boundingBox.bottomRight[1];
//     const bWidth = x2 - x1;
//     const bHeight = y2 - y1;
//     drawLine(output, x1, y1, x2, y1);
//     drawLine(output, x2, y1, x2, y2);
//     drawLine(output, x1, y2, x2, y2);
//     drawLine(output, x1, y1, x1, y2);

//     // Add just the nose, cheeks, eyes, eyebrows & mouth
//     const features = [
//       'noseTip',
//       'leftCheek',
//       'rightCheek',
//       'leftEyeLower1',
//       'leftEyeUpper1',
//       'rightEyeLower1',
//       'rightEyeUpper1',
//       'leftEyebrowLower', //"leftEyebrowUpper",
//       'rightEyebrowLower', //"rightEyebrowUpper",
//       'lipsLowerInner', //"lipsLowerOuter",
//       'lipsUpperInner', //"lipsUpperOuter",
//     ];
//     points = [];
//     features.forEach((feature) => {
//       face.annotations[feature].forEach((x) => {
//         points.push((x[0] - x1) / bWidth);
//         points.push((x[1] - y1) / bHeight);
//       });
//     });
//   });

//   if (points) {
//     let emotion = await predictEmotion(points);
//     setText(`Detected: ${emotion}`);
//   } else {
//     setText('No Face');
//   }

//   requestAnimationFrame(trackFace);
// }

// import '@tensorflow/tfjs-backend-webgl';
// import '@tensorflow-models/face-detection';
// import * as puntosCaras from '@tensorflow-models/face-landmarks-detection';
// import type { Face } from '@tensorflow-models/face-landmarks-detection';
// import { COLORES, DOS_PI, TOTAL_PUNTOS, TRIANGULACION } from './utilidades/constantes';
// import { iniciarCamara } from './utilidades/ayudas';
// import { stack, tensor1d, tensor2d, tidy } from '@tensorflow/tfjs-core';
// import { loadGraphModel } from '@tensorflow/tfjs-converter';
// inicio();
// async function inicio() {
//   const triangular = false;
//   const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
//   const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
//   let reloj: number;
//   const GREEN = '#32EEDB';
//   const camara = await iniciarCamara();
//   const model = puntosCaras.SupportedModels.MediaPipeFaceMesh;
//   const modeloEmociones = await loadGraphModel('/modelos/emociones.json');
//   await modeloEmociones.load();
//   console.log(modeloEmociones);
//   const detectorConfig: puntosCaras.MediaPipeFaceMeshMediaPipeModelConfig = {
//     runtime: 'mediapipe', // o 'tfjs'
//     solutionPath: 'node_modules/@mediapipe/face_mesh', //
//     refineLandmarks: true,
//   };
//   const detector = await puntosCaras.createDetector(model, detectorConfig);

//   escalar();
//   animar();

//   async function detectarCaras() {
//     if (!ctx || !camara) return;

//     if (detector) {
//       try {
//         return await detector.estimateFaces(camara, { flipHorizontal: false });
//       } catch (error) {
//         detector.dispose();
//         alert(error);
//         return;
//       }
//     }
//     return;
//   }

//   async function predictEmotion(points) {
//     let result = tf.tidy(() => {
//       const xs = tf.stack([tf.tensor1d(points)]);
//       return emotionModel.predict(xs);
//     });
//     let prediction = await result.data();
//     result.dispose();
//     // Get the index of the maximum value
//     let id = prediction.indexOf(Math.max(...prediction));
//     return emotions[id];
//   }

//   async function animar() {
//     if (!camara) return;
//     const caras = await detectarCaras();

//     // Pintar video
//     ctx.drawImage(camara, 0, 0, camara.videoWidth, camara.videoHeight);

//     if (caras && caras.length > 0) {
//       pintarCaras(caras);
//     }

//     reloj = requestAnimationFrame(animar);
//   }

//   function pintarForma(puntos: number[][], cerrar: boolean) {
//     if (!ctx) return;

//     const forma = new Path2D();
//     forma.moveTo(puntos[0][0], puntos[0][1]);

//     for (let i = 1; i < puntos.length; i++) {
//       const punto = puntos[i];
//       forma.lineTo(punto[0], punto[1]);
//     }

//     if (cerrar) {
//       forma.closePath();
//     }

//     ctx.stroke(forma);
//   }

//   function pintarCaras(caras: Face[]) {
//     if (!ctx) return;

//     caras.forEach((cara) => {
//       const { xMin, yMin, width, height } = cara.box;
//       const puntos = cara.keypoints.map(({ x, y }) => [(x - xMin) / width, (y - yMin) / height]);
//       console.log(puntos);
//       const emociones = tidy(() => {
//         const xs = stack([tensor2d(puntos)]);
//         const prediccion = modeloEmociones.predict(xs);
//         console.log(prediccion);
//       });
//       // const prediccion = await emociones;
//       // const features = [
//       //   'noseTip',
//       //   'leftCheek',
//       //   'rightCheek',

//       //   'leftEyeLower1',
//       //   'leftEyeUpper1',
//       //   'rightEyeLower1',
//       //   'rightEyeUpper1',
//       //   'leftEyebrowLower', //"leftEyebrowUpper",
//       //   'rightEyebrowLower', //"rightEyebrowUpper",
//       //   'lipsLowerInner', //"lipsLowerOuter",
//       //   'lipsUpperInner', //"lipsUpperOuter",
//       // ];
//       // const points = [];
//       // features.forEach((feature) => {
//       //   cara.annotations[feature].forEach((x) => {
//       //     points.push((x[0] - x1) / bWidth);
//       //     points.push((x[1] - y1) / bHeight);
//       //   });
//       // });

//       if (triangular) {
//         ctx.strokeStyle = GREEN;
//         ctx.lineWidth = 0.5;

//         for (let i = 0; i < TRIANGULACION.length / 3; i++) {
//           const points = [TRIANGULACION[i * 3], TRIANGULACION[i * 3 + 1], TRIANGULACION[i * 3 + 2]].map(
//             (index) => puntos[index]
//           );

//           pintarForma(points, true);
//         }
//       } else {
//         ctx.fillStyle = GREEN;
//         const radio = 1;

//         for (let i = 0; i < TOTAL_PUNTOS; i++) {
//           const x = puntos[i][0];
//           const y = puntos[i][1];

//           ctx.beginPath();
//           ctx.arc(x, y, radio, 0, DOS_PI);
//           ctx.fill();
//         }
//       }

//       pintarContornos(puntos);
//     });
//   }

//   function escalar() {
//     if (!ctx || !camara) return;
//     const videoWidth = camara.videoWidth;
//     const videoHeight = camara.videoHeight;
//     // Must set below two lines, otherwise video element doesn't show.
//     camara.width = videoWidth;
//     camara.height = videoHeight;

//     lienzo.width = videoWidth;
//     lienzo.height = videoHeight;

//     // Because the image from camera is mirrored, need to flip horizontally.
//     ctx.translate(camara.videoWidth, 0);
//     ctx.scale(-1, 1);
//   }

//   function pintarContornos(puntos: number[][]) {
//     if (!ctx) return;

//     const contornos = puntosCaras.util.getKeypointIndexByContour(puntosCaras.SupportedModels.MediaPipeFaceMesh);

//     for (const [nombre, contorno] of Object.entries(contornos)) {
//       ctx.strokeStyle = COLORES[nombre];
//       ctx.lineWidth = 3;
//       const linea = contorno.map((index) => puntos[index]);

//       if (linea.every((punto) => punto != undefined)) {
//         pintarForma(linea, false);
//       }
//     }
//   }
// }
