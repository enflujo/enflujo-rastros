import mediapipe as mp
import cv2 as cv
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

rutaModelo = './estaticos/modelos/face_landmarker.task'

BaseOptions = mp.tasks.BaseOptions
FaceLandmarker = mp.tasks.vision.FaceLandmarker
FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
FaceLandmarkerResult = mp.tasks.vision.FaceLandmarkerResult
VisionRunningMode = mp.tasks.vision.RunningMode
mp_drawing = mp.solutions.drawing_utils
capture = cv.VideoCapture(0)
previousTime = 0
currentTime = 0



def print_result(result: FaceLandmarkerResult, output_image: mp.Image, timestamp_ms: int):
    print('face landmarker result: {}'.format(result))

options = FaceLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=rutaModelo),
    running_mode=VisionRunningMode.LIVE_STREAM,
    result_callback=print_result)

def inicio():
  print('hey')
  while capture.isOpened():
    ret, frame = capture.read()
    frame = cv.resize(frame, (800, 600))
    image = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
    image.flags.writeable = False

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
    image.flags.writeable = True
    image = cv.cvtColor(image, cv.COLOR_RGB2BGR)

    mp_drawing.draw_landmarks(
      image,
      mp_image.face_landmarks
    )

  capture.release()
  cv.destroyAllWindows()

with FaceLandmarker.create_from_options(options) as landmarker:
    inicio()