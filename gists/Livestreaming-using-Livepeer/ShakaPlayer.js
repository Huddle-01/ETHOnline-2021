import { useEffect, useRef } from "react";
import muxjs from "mux.js/dist/mux.js";
import React from "react";
import "shaka-player/dist/controls.css";

const Player = ({
  src,
  posterUrl = "https://via.placeholder.com/160x90/1e1e21/1e1e21",
  config = {
    controlPanelElements: [
      "time_and_duration",
      "play_pause",
      // "rewind",
      // "fast_forward",
      "mute",
      "volume",
      "spacer",
      "fullscreen",
      "overflow_menu",
    ],
    overflowMenuButtons: ["quality"],
  },
}) => {
  const video = useRef(null);
  const videoContainer = useRef(null);
  const controller = useRef({});

  useEffect(() => {
    window["muxjs"] = muxjs;

    // Use compiled versions of these libraries so they work with ad blockers
    const shaka = require("shaka-player/dist/shaka-player.ui.js");

    const player = new shaka.Player(video.current);
    const ui = new shaka.ui.Overlay(
      player,
      videoContainer.current,
      video.current
    );

    ui.configure(config);

    // Store Shaka's API in order to expose it as a handle.
    controller.current = {
      player,
      ui,
      videoElement: video.current,
      config: {},
    };

    return () => {
      player.destroy();
      ui.destroy();
    };
  }, []);

  // Load the source url when we have one.
  useEffect(() => {
    const { player } = controller.current;
    if (player) {
      player.load(src.trim());
    }
  }, [src]);

  return (
    <div ref={videoContainer}>
      <video
        muted
        autoPlay
        id="video"
        ref={video}
        className="w-full h-full"
        poster={posterUrl}
      />
    </div>
  );
};

export default Player;
