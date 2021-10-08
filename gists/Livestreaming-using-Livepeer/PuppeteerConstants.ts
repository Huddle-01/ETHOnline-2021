import { ERecorderType } from "../types/ERecorderType";

export const getPuppeteerArgs = (xvfbDisplay?: any) => {
  return [
    "--enable-usermedia-screen-capturing",
    "--allow-http-screen-capture",
    "--no-sandbox",
    "--allow-insecure-localhost",
    "--autoplay-policy=no-user-gesture-required",
    "--start-fullscreen",
    "--window-size=1920,1080",
    xvfbDisplay ? `--display=${xvfbDisplay}` : "",
  ];
};

export const ffmpegArgs = (
  recorderType: ERecorderType,
  filepath?: string,
  streamKey?: string
) => {
  return [
    "-i",
    "-",
    "-c:v",
    "libx264",
    "-x264-params",
    "keyint=60:scenecut=0",
    "-c:a",
    "aac",
    "-ar",
    "44100",
    "-b:a",
    "128k",
    "-max_muxing_queue_size",
    "8192",
    "-f",
    "flv",
    recorderType === ERecorderType.RECORDING
      ? `${filepath}`
      : `rtmp://rtmp.livepeer.com/live/${streamKey}`,
  ];
};
