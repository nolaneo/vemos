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

class NetflixHandler extends VideoHandler {
  netflixAPI = undefined;
  netflixPlayer = undefined;

  constructor(peerService, parentDomService) {
    super(peerService, parentDomService);
    this.handlerName = "Netflix";
  }

  async performSeek(time) {
    console.log("[Netflix] Perform Seek");
    this.parentDomService.window.postMessage({ vemosSeekTime: time }, "*");
    return await timeout(50);
  }
}

export default class VideoSyncService extends Service {
  @service peerService;
  @service parentDomService;

  currentHandler = undefined;

  async initialize() {
    // Give the host some time to load their video player
    await timeout(5000);
    this.currentHandler = new this.handlerClass(
      this.peerService,
      this.parentDomService
    );
    this.currentHandler.addListeners();

    this.peerService.addEventHandler("video-seek", this.seek.bind(this));
    this.peerService.addEventHandler("video-play", this.play.bind(this));
    this.peerService.addEventHandler("video-pause", this.pause.bind(this));
  }

  async play(message) {
    await this.currentHandler.play(message.data.time);
  }

  async pause() {
    await this.currentHandler.pause();
  }

  async seek(message) {
    await this.currentHandler.seek(message.data.time);
  }

  get handlerClass() {
    if (this.parentDomService.window.location.href.includes("netflix.com")) {
      return NetflixHandler;
    } else {
      return VideoHandler;
    }
  }
}
