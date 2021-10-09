import * as dotenv from "dotenv";
import { TLivepeerProfiles } from "../types/Livepeer";

dotenv.config();

const CREATE_STREAM_URL = "https://livepeer.com/api/stream";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
};

const profiles: TLivepeerProfiles = [
  {
    name: "720p",
    bitrate: 2000000,
    fps: 30,
    width: 1280,
    height: 720,
  },
  {
    name: "480p",
    bitrate: 1000000,
    fps: 30,
    width: 854,
    height: 480,
  },
  {
    name: "360p",
    bitrate: 500000,
    fps: 30,
    width: 640,
    height: 360,
  },
];

const getPlaybackUrl = (playbackId: string) => {
  return `https://cdn.livepeer.com/hls/${playbackId}/index.m3u8`;
};

const VERIFY_STREAM_STATUS = (streamId: string) => {
  return `https://livepeer.com/api/stream/${streamId}`;
};

export {
  CREATE_STREAM_URL,
  headers,
  profiles,
  getPlaybackUrl,
  VERIFY_STREAM_STATUS,
};
