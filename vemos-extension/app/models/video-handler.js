import { RTCMessage } from "../services/peer-service";
import { isNone } from "@ember/utils";
import { timeout } from "ember-concurrency";

export default class VideoHandler {
  ignoredEvents = new Set();
  handlerName = "Default";
  peerService = undefined;
  parentDomService = undefined;
  videoElement = undefined;
  videoDOMObserver = undefined;

  constructor(peerService, parentDomService) {
    this.peerService = peerService;
    this.parentDomService = parentDomService;
  }

  /*
   * By default, this function simply finds the largest video in the parent DOM
   */
  getElementReference() {
    console.log("getElementReference");
    let videos = Array.from(
      this.parentDomService.window.document.querySelectorAll("video")
    );
    console.log(`${this.handlerName} Handler – Found ${videos.length} videos`);
    let largestVideoSize = 0;
    let video = videos.firstObject;

    for (let i = 0; i < videos.length; ++i) {
      let rect = video.getBoundingClientRect();
      let size = rect.height * rect.width;
      if (size > largestVideoSize) {
        largestVideoSize = size;
        video = videos[i];
      }
    }
    return video;
  }

  async seek(time) {
    if (Math.abs(time - this.videoElement.currentTime) < 0.5) {
      return console.log("Ignoring seek as time within 500ms");
    }

    return await this.withDisabledEventPropagation(["seek"], async () => {
      console.log("seek", time);
      await this.performSeek(time);
    });
  }

  async performSeek(time) {
    this.videoElement.currentTime = time;
  }

  async play(time) {
    await this.seek(time);
    if (this.videoElement.paused) {
      return await this.withDisabledEventPropagation(["play"], async () => {
        console.log("play");
        await this.performPlay();
      });
    } else {
      console.log("Ignoring play – already playing");
    }
  }

  async performPlay() {
    return await this.videoElement.play();
  }

  async pause() {
    if (!this.videoElement.paused) {
      return await this.withDisabledEventPropagation(["pause"], async () => {
        console.log("pause");
        await this.performPause();
      });
    } else {
      console.log("Ignoring pause – already paused");
    }
  }

  async performPause() {
    return await this.videoElement.pause();
  }

  async withDisabledEventPropagation(events, block) {
    events.forEach((event) => this.ignoredEvents.add(event));
    await block.call();
    await timeout(50);
    events.forEach((event) => this.ignoredEvents.delete(event));
  }

  async addListeners() {
    console.log("Adding video listeners...");
    if (this.videoDOMObserver) {
      this.videoDOMObserver.disconnect();
    }

    await timeout(3000);
    this.videoElement = this.getElementReference();

    if (isNone(this.videoElement)) {
      return console.error("No video found");
    }

    this.videoElement.pause();
    await timeout(100);

    this.videoElement.addEventListener("seeked", this.onSeek.bind(this));
    this.videoElement.addEventListener("play", this.onPlay.bind(this));
    this.videoElement.addEventListener("pause", this.onPause.bind(this));

    this.videoDOMObserver = new MutationObserver(this.checkForVideoElement.bind(this));
    this.videoDOMObserver.observe(this.parentDomService.window.document.body, {childList: true, subtree: true });

    console.log("Video listeners added.");
  }
  
  checkForVideoElement() {
    if (!this.parentDomService.window.document.body.contains(this.videoElement)) {
      console.log('Video element lost, attempting to reninitialize');
      this.addListeners();
    }
  }

  onSeek() {
    console.log("onSeek");
    if (this.ignoredEvents.has("seek")) {
      console.log("Seek event ignored");
      return;
    }
    let message = new RTCMessage({
      event: "video-seek",
      data: {
        time: this.videoElement.currentTime,
      },
    });
    this.peerService.sendRTCMessage(message);
  }

  onPlay() {
    console.log("onPlay");
    if (this.ignoredEvents.has("play")) {
      console.log("Play event ignored");
      return;
    }
    let message = new RTCMessage({
      event: "video-play",
      data: {
        time: this.videoElement.currentTime,
      },
    });
    this.peerService.sendRTCMessage(message);
  }

  onPause() {
    console.log("onPause");
    if (this.ignoredEvents.has("pause")) {
      console.log("Pause event ignored");
      return;
    }
    let message = new RTCMessage({
      event: "video-pause",
      data: {},
    });
    this.peerService.sendRTCMessage(message);
  }

  removeListeners() {}
}