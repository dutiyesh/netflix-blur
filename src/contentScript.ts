"use strict";

import elementReady from "element-ready";
import tinykeys from "tinykeys";
import { BLUR_ON_ICON, BLUR_OFF_ICON } from "./icons";
import "./contentScript.css";

type CallbackFunction = () => void;

let unsubscribeShortcut: CallbackFunction | undefined;

function cleanUp(): void {
  document.body.classList.remove("netflix-blur-active");

  if (typeof unsubscribeShortcut === "function") {
    unsubscribeShortcut();
    unsubscribeShortcut = undefined;
  }
}

async function initialize(): Promise<void> {
  const controlsElement = await elementReady(
    ".PlayerControlsNeo__bottom-controls",
    {
      stopOnDomReady: false,
    }
  );

  const titleElement = controlsElement!.querySelector(".video-title");

  // clean up prev state
  cleanUp();

  const blurButton = document.querySelector(
    ".netflix-blur-player-blur-control"
  );
  if (blurButton) {
    titleElement!.removeChild(blurButton);
  }

  const playerControlElement = document.createElement("div");
  playerControlElement.classList.add(
    "touchable",
    "PlayerControls--control-element",
    "nfp-popup-control",
    "netflix-blur-player-blur-control"
  );
  playerControlElement.title = "Blur";

  playerControlElement.addEventListener("click", () => {
    const bodyElement = document.body;

    if (bodyElement.classList.contains("netflix-blur-active")) {
      bodyElement.classList.remove("netflix-blur-active");
      playerControlElement.title = "Blur";
    } else {
      bodyElement.classList.add("netflix-blur-active");
      playerControlElement.title = "Unblur";
    }
  });

  const html = `<button class="touchable PlayerControls--control-element nfp-button-control default-control-button" tabIndex="0" role="button" aria-label="Blur Video Player">
  ${BLUR_ON_ICON}
  ${BLUR_OFF_ICON}
</button>`;

  playerControlElement.innerHTML = html;
  titleElement!.parentNode!.insertBefore(
    playerControlElement,
    titleElement!.nextSibling
  );

  // add shortcut key
  unsubscribeShortcut = tinykeys(window, {
    b: () => {
      const blurButton = document.querySelector(
        ".netflix-blur-player-blur-control"
      );

      if (blurButton) {
        const clickEvent = new Event("click");

        blurButton.dispatchEvent(clickEvent);
      }
    },
  });
}

chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === "ADD_BLUR_BUTTON") {
    initialize();
  } else if (message.type === "CLEAN_UP") {
    cleanUp();
  }
});
