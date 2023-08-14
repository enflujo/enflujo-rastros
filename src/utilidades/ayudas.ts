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
