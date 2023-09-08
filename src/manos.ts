// Copyright 2023 The MediaPipe Authors.

import { DrawingUtils, FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { escalarLienzo } from './utilidades/ayudas';

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const demosSection = document.getElementById('demos');

let handLandmarker: HandLandmarker;
let enableWebcamButton: HTMLButtonElement;
let webcamRunning: Boolean = false;
let lienzo: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let reloj = 0;

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  });
};

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/

export default { prender, apagar };

async function prender() {
  await createHandLandmarker();
  const video = document.getElementById('camara') as HTMLVideoElement;
  lienzo = document.createElement('canvas');
  lienzo.className = 'lienzo';
  document.body.appendChild(lienzo);
  lienzo.style.zIndex = '999';
  ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;

  escalarLienzo(lienzo, ctx, video);

  const pintor = new DrawingUtils(ctx);

  let lastVideoTime = -1;
  let results = undefined;
  predictWebcam();
  async function predictWebcam() {
    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime;
      results = handLandmarker.detectForVideo(video, startTimeMs);
    }
    ctx.save();
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    if (results && results.landmarks) {
      for (const landmarks of results.landmarks) {
        pintor.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 5,
        });
        pintor.drawLandmarks(landmarks, { color: '#FF0000', lineWidth: 2 });
      }
    }
    ctx.restore();

    window.requestAnimationFrame(predictWebcam);
  }
}

function apagar() {}
