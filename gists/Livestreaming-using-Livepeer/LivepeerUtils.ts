import axios from "axios";
import {
  CREATE_STREAM_URL,
  headers,
  profiles,
  VERIFY_STREAM_STATUS,
} from "../constants/Livepeer";
import { IStreamResponse } from "../types/Livepeer";

const createStream = async (streamName: string) => {
  const { data: stream } = await axios.post(
    CREATE_STREAM_URL,
    { name: streamName, profiles: [] },
    { headers: headers }
  );
  return stream as IStreamResponse;
};

const getStreamStatus = async (streamId: string) => {
  const { data: _stream } = await axios.get(VERIFY_STREAM_STATUS(streamId), {
    headers: headers,
  });
  const stream = _stream as IStreamResponse;
  const streamStatus = stream.isActive;
  return streamStatus;
};

export { createStream, getStreamStatus };
