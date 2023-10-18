export interface WasmFileset {
  /** The path to the Wasm loader script. */
  wasmLoaderPath: string;
  /** The path to the Wasm binary. */
  wasmBinaryPath: string;
  /** The optional path to the asset loader script. */
  assetLoaderPath?: string;
  /** The optional path to the assets binary. */
  assetBinaryPath?: string;
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
