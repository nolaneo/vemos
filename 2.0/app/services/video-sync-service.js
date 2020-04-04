import Service from "@ember/service";
import { inject as service } from "@ember/service";
import { timeout } from "ember-concurrency";
import { RTCMessage } from "./peer-service";

class VideoHandler {
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
    this.videoElement.currentTime = time;
  }

  play() {
    this.videoElement.play();
  }

  pause() {
    this.videoElement.pause();
  }

  async addListeners() {
    console.log("Adding video listeners...");
    await timeout(3000);
    this.videoElement = this.getElementReference();

    this.videoElement.addEventListener("seeked", () => {
      let message = new RTCMessage({
        event: "video-seek",
        data: {
          time: this.videoElement.currentTime,
        },
      });
      this.peerService.sendRTCMessage(message);
    });

    this.videoElement.addEventListener("play", () => {
      let message = new RTCMessage({
        event: "video-play",
        data: {},
      });
      this.peerService.sendRTCMessage(message);
    });

    this.videoElement.addEventListener("pause", () => {
      let message = new RTCMessage({
        event: "video-pause",
        data: {},
      });
      this.peerService.sendRTCMessage(message);
    });
    console.log("Video listeners added.");
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
