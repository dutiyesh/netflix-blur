"use strict";

function isNetflixWebsite(url: string = ""): boolean {
  return url.indexOf("https://www.netflix.com/") === 0;
}

function isNetflixWatchPage(url: string = ""): boolean {
  return url.indexOf("https://www.netflix.com/watch/") === 0;
}

let cleanUp: boolean = false;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (isNetflixWebsite(tab.url)) {
      if (isNetflixWatchPage(tab.url)) {
        chrome.tabs.sendMessage(tabId, {
          type: "ADD_BLUR_BUTTON",
        });

        cleanUp = true;
      } else {
        if (cleanUp) {
          chrome.tabs.sendMessage(tabId, {
            type: "CLEAN_UP",
          });

          cleanUp = false;
        }
      }
    }
  }
});
