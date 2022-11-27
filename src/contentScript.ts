"use strict";

import elementReady from "element-ready";
import tinykeys from "tinykeys";
import { BLUR_ON_ICON, BLUR_OFF_ICON } from "./icons";
import "./contentScript.css";

type CallbackFunction = () => void;

let unsubscribeShortcut: CallbackFunction | undefined;
let domObserver: MutationObserver;

function cleanUp(): void {
  document.body.classList.remove("netflix-blur-active");

  if (typeof unsubscribeShortcut === "function") {
    unsubscribeShortcut();
    unsubscribeShortcut = undefined;
  }

  if (domObserver) {
    domObserver.disconnect();
  }
}

async function initializeObserver() {
  const targetNode = await elementReady("[data-uia='player']", {
    stopOnDomReady: false,
    timeout: 10000,
  });

  if (typeof targetNode === "undefined") {
    return;
  }

  const config = { attributes: false, childList: true, subtree: true };

  const callback = (mutationList: MutationRecord[]) => {
    for (const mutation of mutationList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        const controlsElement = Array.from(mutation.addedNodes).find(
          (node: any) => {
            return (
              node.querySelector("[data-uia='control-audio-subtitle']") !== null
            );
          }
        );

        if (controlsElement) {
          initializeBlurControl();
        }
      }
    }
  };

  domObserver = new MutationObserver(callback);
  domObserver.observe(targetNode!, config);
}

async function initializeBlurControl(): Promise<void> {
  const audioSubtitleControlElement = await elementReady(
    "[data-uia='control-audio-subtitle']",
    {
      stopOnDomReady: false,
      timeout: 10000,
    }
  );

  if (typeof audioSubtitleControlElement === "undefined") {
    return;
  }

  const blurButton = document.querySelector(
    ".netflix-blur-player-blur-control"
  );

  if (blurButton) {
    blurButton.remove();
  }

  const playerControlElement = document.createElement("div");
  playerControlElement.classList.add("netflix-blur-player-blur-control");
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

  const html = `<button class="netflix-blur-player-button" tabIndex="0" role="button" aria-label="Blur Video Player">
  ${BLUR_ON_ICON}
  ${BLUR_OFF_ICON}
</button>`;

  playerControlElement.innerHTML = html;
  audioSubtitleControlElement!.parentNode!.parentNode!.insertBefore(
    playerControlElement,
    audioSubtitleControlElement!.parentNode!.parentNode!.firstChild
  );

  if (typeof unsubscribeShortcut === "undefined") {
    initShortcut();
  }
}

function initShortcut() {
  unsubscribeShortcut = tinykeys(window, {
    b: () => {
      if (document.body.classList.contains("netflix-blur-active")) {
        document.body.classList.remove("netflix-blur-active");
      } else {
        document.body.classList.add("netflix-blur-active");
      }
    },
  });
}

chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === "ADD_BLUR_BUTTON") {
    initShortcut();
    initializeObserver();
    initializeBlurControl();
  } else if (message.type === "CLEAN_UP") {
    cleanUp();
  }
});
