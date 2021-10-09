import { proto, processMsgs, selectFleetEnv } from "./wakuUtils";
import { getBootstrapNodes, Waku, WakuMessage } from "js-waku";
import { useParams } from "react-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const WakuChat = () => {
  const [waku, setWaku] = useState(undefined);
  const [wakuStatus, setWakuStatus] = useState("None");
  const [wakuMsgs, setWakuMsgs] = useState([]);
  
  const dispatch = useDispatch();
  
  const { id } = useParams();

  const ContentTopic = `/huddle01-livestream/1/livepeer-chat/${id}`;
  
  // creating waku object
  useEffect(() => {
    if (!!waku) return;
    if (wakuStatus !== "None") return;

    setWakuStatus("Starting");

    // Create Waku
    Waku.create({
      libp2p: {
        config: {
          pubsub: {
            enabled: true,
            emitSelf: true,
          },
        },
      },
      bootstrap: getBootstrapNodes.bind({}, selectFleetEnv()),
    }).then((waku) => {
      setWaku(waku);
      setWakuStatus("Started");
      waku.waitForConnectedPeer().then(() => {
        setWakuStatus("Ready");
        console.log(wakuStatus);
      });
    });
    console.log(wakuStatus);
  }, [waku, wakuStatus]);
  
  const processWakuHistory = (retrievedMessages) => {
    const messages = retrievedMessages
      .map((msg) => processMsgs(msg))
      .filter(Boolean);

    setWakuMsgs((waku) => {
      return messages.concat(waku);
    });

    if (wakuMsgs.length >= 20) return true;
  };
  
  // fetching history of chats from waku-store
  useEffect(() => {
    if (wakuStatus !== "Ready") return;

    waku.store
      .queryHistory([ContentTopic], { callback: processWakuHistory })
      .catch((e) => {
        console.log("Failed to retrieve messages", e);
      });
    dispatch(setWakuStoreRetrieved(true));
  }, [waku, wakuStatus]);
  
  // sending message using waku-relay
  const handleWakuMessage = async (msgInput) => {
    if (!isLivestreamChat) return;
    if (wakuStatus !== "Ready") return;
    if (!msgInput) return;

    const text = msgInput.trim();

    const payload = proto.SimpleChatMessage.encode({
      timestamp: new Date(),
      text: text,
      sender:
        localStorage.getItem("livestream_viewer") ||
        window.ethereum.selectedAddress,
    });

    WakuMessage.fromBytes(payload, ContentTopic).then((wakuMessage) =>
      waku.relay.send(wakuMessage)
    );
    console.log(payload);
  };
  
  // observer for receiving messages
  const processIncomingMessage = useCallback((wakuMessage) => {
    const message = processMsgs(wakuMessage);
    setWakuMsgs((messages) => {
      return messages.concat(message);
    });
  }, []);

  // receive message using waku-relay
  useEffect(() => {
    if (!waku) return;

    waku.relay.addObserver(processIncomingMessage, [ContentTopic]);

    return function cleanUp() {
      waku.relay.deleteObserver(processIncomingMessage, [ContentTopic]);
    };
  }, [waku, wakuStatus, processIncomingMessage]);
  
  return (
    /**
    display wakuMsgs in UI
    */
  );
  
};

export default WakuChat;