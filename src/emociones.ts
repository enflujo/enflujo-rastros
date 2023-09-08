import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as gestosCara from '@tensorflow-models/face-detection';

const status = document.createElement('div');
status.className = 'mensaje';
document.body.appendChild(status);

const lienzo = document.createElement('canvas');
lienzo.className = 'lienzo';
const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
document.body.appendChild(lienzo);

function setText(text: string) {
  status.innerText = text;
}

function drawLine(x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

async function setupWebcam() {
  return new Promise((resolve, reject) => {
    const webcamElement = document.getElementById('camara');
    const navigatorAny = navigator;
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigatorAny.webkitGetUserMedia ||
      navigatorAny.mozGetUserMedia ||
      navigatorAny.msGetUserMedia;
    if (navigator.getUserMedia) {
      navigator.getUserMedia(
        { video: true },
        (stream) => {
          webcamElement.srcObject = stream;
          webcamElement.addEventListener('loadeddata', resolve, false);
        },
        (error) => reject()
      );
    } else {
      reject();
    }
  });
}

const emotions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'];
let emotionModel: tf.LayersModel;

let model: gestosCara.FaceDetector;

async function predictEmotion(points) {
  let result = tf.tidy(() => {
    const xs = tf.stack([tf.tensor1d(points)]);
    return emotionModel.predict(xs);
  });
  let prediction = await result.data();
  result.dispose();
  // Get the index of the maximum value
  let id = prediction.indexOf(Math.max(...prediction));
  return emotions[id];
}

async function trackFace() {
  const video = document.getElementById('camara') as HTMLVideoElement;
  const faces = await model.estimateFaces(camara, { flipHorizontal: false });
  // {
  //   input: video,
  //   returnTensors: false,
  //   flipHorizontal: false,
  // });
  ctx.drawImage(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);

  let points = null;
  faces.forEach((face) => {
    // Draw the bounding box
    const x1 = face.box.xMin;
    const y1 = face.box.yMin;
    const x2 = face.box.xMax;
    const y2 = face.box.yMax;
    const bWidth = x2 - x1;
    const bHeight = y2 - y1;
    drawLine(x1, y1, x2, y1);
    drawLine(x2, y1, x2, y2);
    drawLine(x1, y2, x2, y2);
    drawLine(x1, y1, x1, y2);

    // Add just the nose, cheeks, eyes, eyebrows & mouth
    const features = [
      'noseTip',
      'leftCheek',
      'rightCheek',
      'leftEyeLower1',
      'leftEyeUpper1',
      'rightEyeLower1',
      'rightEyeUpper1',
      'leftEyebrowLower', //"leftEyebrowUpper",
      'rightEyebrowLower', //"rightEyebrowUpper",
      'lipsLowerInner', //"lipsLowerOuter",
      'lipsUpperInner', //"lipsUpperOuter",
    ];
    points = [];
    features.forEach((feature) => {
      console.log(face, face.keypoints[feature]);
      face.annotations[feature].forEach((x) => {
        points.push((x[0] - x1) / bWidth);
        points.push((x[1] - y1) / bHeight);
      });
    });
  });

  if (points) {
    let emotion = await predictEmotion(points);
    setText(`Detected: ${emotion}`);
  } else {
    setText('No Face');
  }

  requestAnimationFrame(trackFace);
}

export default async () => {
  await setupWebcam();
  const video = document.getElementById('camara') as HTMLVideoElement;
  video.play();
  let videoWidth = video.videoWidth;
  let videoHeight = video.videoHeight;
  video.width = videoWidth;
  video.height = videoHeight;

  lienzo.width = video.width;
  lienzo.height = video.height;

  ctx.translate(lienzo.width, 0);
  ctx.scale(-1, 1); // Mirror cam
  ctx.fillStyle = '#fdffb6';
  ctx.strokeStyle = '#fdffb6';
  ctx.lineWidth = 2;

  // Load Face Landmarks Detection
  // model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh);
  const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
    refineLandmarks: true,
  };

  model = await faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
    detectorConfig
  );

  // Load Emotion Detection
  emotionModel = await tf.loadLayersModel('/modelos/facemo.json');
  setText('Loaded!');

  trackFace();
};
