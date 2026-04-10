declare module "@amap/screenshot" {
  export class Screenshot {
    constructor(map: unknown);
    toDataURL(type?: "image/png" | "image/jpeg"): Promise<string>;
    toCanvas(): Promise<HTMLCanvasElement>;
    download(opts: { filename: string; type?: "image/png" | "image/jpeg" }): Promise<void>;
  }
}
