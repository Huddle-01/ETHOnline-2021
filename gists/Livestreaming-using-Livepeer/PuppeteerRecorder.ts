import AWS from "aws-sdk";
import child_process from "child_process";
import fs from "fs";
import { getStream, launch } from "puppeteer-stream";
import { getPlaybackUrl } from "../constants/Livepeer";
import { ffmpegArgs, getPuppeteerArgs } from "../constants/Puppeteer";
import { ERecorderType } from "../types/ERecorderType";
import IUploadedURLs from "../types/IUploadedURLs";
import { IStreamResponse } from "../types/Livepeer";
import { uploadToIPFS, uploadToS3 } from "../utils/fileUploadEndpoints";
import { createStream, getStreamStatus } from "../utils/Livepeer";
const Xvfb = require("xvfb");

const BOT_PASSWORD: string = process.env.BOT_PASSWORD;

export default class Recorder {
  roomId: string;
  requestOrigin: string;
  file: any;
  xvfb: any;
  stream: any;
  url: any;
  s3: AWS.S3;
  fileName: string;
  filepath: string;
  type: ERecorderType;
  ffmpeg: any;

  constructor(roomId: string, requestOrigin: string, type: ERecorderType) {
    this.requestOrigin = requestOrigin;
    this.roomId = roomId.split("_")[1];
    this.fileName = `${Date.now()}-${this.roomId}.flv`;
    this.filepath = __dirname + `/recordings/${this.fileName}`;
    this.url = this._getUrl(this.requestOrigin);
    this.xvfb = new Xvfb({
      silent: true,
      xvfb_args: ["-screen", "0", "1920x1080x24", "-ac"],
    });
    this.stream = null;
    this.type = type;
    this.type === ERecorderType.STREAMING && (this.ffmpeg = null);
    console.log({ type });
  }

  async startRecord(): Promise<IStreamResponse> {
    this.xvfb.startSync((err: any) => {
      console.error("Error while starting XVFB - ", err);
    });
    let page: any;

    try {
      const browser = await launch({
        defaultViewport: null,
        headless: false,
        args: getPuppeteerArgs(this.xvfb._display),
      });

      page = await browser.newPage();

      await page.evaluateOnNewDocument((password: string) => {
        localStorage.clear();
        localStorage.setItem("bot_password", password);
      }, BOT_PASSWORD);

      console.info(`Recording bot going to - ${this.url}`);

      await page.goto(this.url, {
        waitUntil: "networkidle2",
        timeout: 0,
      });
    } catch (error) {
      throw new Error(
        `Error while starting recording in initialising puppeteer - ${error}`
      );
    }

    try {
      console.info("Starting recording...: ", this.type);
      this.stream = await getStream(page, {
        audio: true,
        video: true,
        audioBitsPerSecond: 128 * 1000,
        videoBitsPerSecond: 3 * 1024 * 1024,
      });

      let liveStream: IStreamResponse;

      switch (this.type) {
        case ERecorderType.STREAMING:
          try {
            liveStream = await this._setupStreaming();
          } catch (error) {
            console.error(error);
          }
          break;
        case ERecorderType.RECORDING:
          try {
            this._setupRecording();
          } catch (error) {
            console.error(error);
          }
          break;

        default:
          break;
      }

      //write buffer array to ffmpeg
      this.stream.on("data", (data: any) => {
        this.ffmpeg?.stdin.write(data);
      });

      return liveStream;
    } catch (error) {
      throw new Error(
        `Error while starting recording in getting stream - ${error}`
      );
    }
  }

  stopRecord(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.stream.destroy();
        this.ffmpeg?.kill("SIGINT");
        this.ffmpeg?.stdin.end();
        console.info("finished");
        this.ffmpeg.on("close", (code: any) => {
          console.log(`child process exited with code ${code}`);
          resolve();
          console.log("done");
        });
        await this.xvfb.stop();
      } catch (error) {
        reject(error);
      }
    });
  }

  _setupRecording() {
    try {
      this._initFfmpeg(ERecorderType.RECORDING, this.filepath, undefined);
    } catch (error) {
      throw error;
    }
  }

  async _setupStreaming() {
    try {
      console.log("creating a stream");
      const stream = await createStream(this.roomId);
      console.log({ stream });
      // const streamStatus = await getStreamStatus(stream.id);
      // console.log({ streamStatus });
      // const playbackUrl = getPlaybackUrl(stream.playbackId);
      // console.log({ playbackUrl });
      this._initFfmpeg(ERecorderType.STREAMING, undefined, stream.streamKey);
      return stream;
    } catch (error) {
      throw error;
    }
  }

  _initFfmpeg(type: ERecorderType, filepath?: string, streamKey?: string) {
    console.info("initing ffmpeg");

    this.ffmpeg = child_process.spawn(
      "ffmpeg",
      ffmpegArgs(type, filepath, streamKey)
    );

    // console.log(this.ffmpeg);

    this.ffmpeg.stderr.pipe(process.stdout);
    this.ffmpeg.stdout.pipe(process.stdout);
  }

  async uploadFile(): Promise<IUploadedURLs> {
    try {
      console.info("Uploading recorded files...");
      let uploadedURLs: any;

      if (this._isCryptoDomain(this.requestOrigin)) {
        const ipfsURL = await this._uploadFileToIPFS();
        const s3URL = await this._uploadFileToS3();
        uploadedURLs = { s3URL, ipfsURL };
      } else {
        const s3URL = await this._uploadFileToS3();
        uploadedURLs = { s3URL };
      }

      console.info(`Files have been uploaded - ${{ uploadedURLs }}`);

      // this._deleteFileFromLocal();

      return uploadedURLs;
    } catch (error) {
      throw new Error(
        `An error occurred while uploading the recorded files - ${error}`
      );
    }
  }

  _deleteFileFromLocal = () => {
    console.info("Deleting from local- ", this.filepath);
    fs.unlinkSync(this.filepath);
  };

  _uploadFileToS3 = async (): Promise<string> => {
    console.log("Uploading file to S3...");

    try {
      const dataLocation = await uploadToS3(this.filepath, this.fileName);
      return dataLocation;
    } catch (error) {
      throw new Error(`Error while uploading to s3 - ${error}`);
    }
  };

  _uploadFileToIPFS = async (): Promise<string> => {
    console.log("Uploading to IPFS...");
    try {
      const data = await uploadToIPFS(this.filepath);
      return data.ipfsURL;
    } catch (error) {
      throw new Error(`Error while uploading to IPFS - ${error}`);
    }
  };

  _isCryptoDomain = (requestOrigin: string): Boolean => {
    if (
      requestOrigin.search("ipfs") !== -1 ||
      requestOrigin.search("crypto") !== -1 ||
      requestOrigin.search("fleek") !== -1 ||
      requestOrigin.search("live") !== -1 ||
      requestOrigin.search("#") !== -1
    ) {
      return true;
    } else {
      return false;
    }
  };

  _getUrl = (requestOrigin: string): string => {
    let url: string;
    // if (this._isCryptoDomain(requestOrigin)) {
    url = requestOrigin + `/?roomId=${this.roomId}#/room`;
    // } else {
    //   url = requestOrigin + `/room?roomId=${this.roomId}`;
    // }
    return url;
  };
}
