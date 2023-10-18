import type { Acciones } from '@/tipos/compartidos';

export async function iniciarCamara(): Promise<HTMLVideoElement | null> {
  const camara = document.getElementById('camara') as HTMLVideoElement;
  if (!camara) return null;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Your browser does not support webcams, please try in another browser like Firefox or Chrome.');
  }

  const videoConfig = {
    audio: false,
    video: {
      facingMode: 'user',
      width: 1280,
      height: 720,
      frameRate: { ideal: 60 },
    },
  };

  const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
  camara.srcObject = stream;

  camara.play();
  return new Promise((resolve) => {
    camara.onloadedmetadata = () => {
      resolve(camara);
    };
  });
}

export function escalarVideo(camara: HTMLVideoElement) {
  if (!camara) return;
  // const videoWidth = camara.videoWidth;
  // const videoHeight = camara.videoHeight;
  // Must set below two lines, otherwise video element doesn't show.
  // camara.width = videoWidth;
  // camara.height = videoHeight;
}

export function escalarLienzo(lienzo: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  if (!ctx) return;
  lienzo.width = window.innerWidth;
  lienzo.height = window.innerHeight;

  // Because the image from camera is mirrored, need to flip horizontally.
  ctx.translate(window.innerWidth, 0);
  ctx.scale(-1, 1);
}

export function nuevoEventoEnFlujo(tipo: Acciones, datos?: string) {
  document.body.dispatchEvent(
    new CustomEvent('enflujo', {
      detail: { tipo, datos },
    })
  );
}
