import protons from "protons";
const proto = protons(`
    message SimpleChatMessage {
      uint64 timestamp = 1;
      string text = 2;
      string sender = 3;
    }
  `);

const selectFleetEnv = () => {
  // Works with react-scripts
  if (process?.env?.NODE_ENV === "development") {
    return ["fleets", "wakuv2.test", "waku-websocket"];
  } else {
    return ["fleets", "wakuv2.prod", "waku-websocket"];
  }
};

const processMsgs = (msg) => {
  if (!msg.payload) return;

  const { timestamp, text, sender } = proto.SimpleChatMessage.decode(
    msg.payload
  );

  const time = new Date(timestamp).toLocaleTimeString();

  const utf8Text = Buffer.from(text).toString("utf-8");

  return { timestamp: time, text: utf8Text, sender };
};

export { proto, selectFleetEnv, processMsgs };
