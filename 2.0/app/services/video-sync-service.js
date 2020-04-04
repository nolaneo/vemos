import Service from "@ember/service";
import { inject as service } from "@ember/service";
import { timeout } from "ember-concurrency";
import { RTCMessage } from "./peer-service";
import { isNone } from "@ember/utils";

class VideoHandler {
  ignoredEvents = new Set();
  handlerName = "Default";
  peerService = undefined;
  parentDomService = undefined;
  videoElement = undefined;

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

  seek(time) {
    if (time !== this.videoElement.currentTime) {
      this.withDisabledEventPropagation("seek", () => {
        this.videoElement.currentTime = time;
      });
    }
  }

  play() {
    if (this.videoElement.paused) {
      this.withDisabledEventPropagation("play", () => {
        this.videoElement.play();
      });
    }
  }

  pause() {
    if (!this.videoElement.paused) {
      this.withDisabledEventPropagation("pause", () => {
        this.videoElement.pause();
      });
    }
  }

  async withDisabledEventPropagation(event, block) {
    this.ignoredEvents.add(event);
    block.call();
    await timeout(100);
    this.ignoredEvents.delete(event);
  }

  async addListeners() {
    console.log("Adding video listeners...");
    await timeout(3000);
    this.videoElement = this.getElementReference();

    if (isNone(this.videoElement)) {
      return console.error("No video found");
    }

    this.videoElement.pause();

    this.videoElement.addEventListener("seeked", this.onSeek.bind(this));
    this.videoElement.addEventListener("play", this.onPlay.bind(this));
    this.videoElement.addEventListener("pause", this.onPause.bind(this));

    console.log("Video listeners added.");
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
      data: {},
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

class NetflixHandler extends VideoHandler {
  constructor(peerService, parentDomService) {
    super(peerService, parentDomService);
    this.handlerName = "Netflix";
  }
}

export default class VideoSyncService extends Service {
  @service peerService;
  @service parentDomService;

  currentHandler = undefined;

  initialize() {
    this.currentHandler = new this.handlerClass(
      this.peerService,
      this.parentDomService
    );
    this.currentHandler.addListeners();

    this.peerService.addEventHandler("video-seek", this.seek.bind(this));
    this.peerService.addEventHandler("video-play", this.play.bind(this));
    this.peerService.addEventHandler("video-pause", this.pause.bind(this));
  }

  play() {
    this.currentHandler.play();
  }

  pause() {
    this.currentHandler.pause();
  }

  seek(message) {
    this.currentHandler.seek(message.data.time);
  }

  get handlerClass() {
    return NetflixHandler;
  }
}
