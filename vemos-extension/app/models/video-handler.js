import { RTCMessage } from "../services/peer-service";
import { isNone, isPresent } from "@ember/utils";
import { timeout } from "ember-concurrency";
import { throttle } from "@ember/runloop";
import { tracked } from "@glimmer/tracking";

export default class VideoHandler {
  @tracked playerState = {
    isPaused: false,
    isMuted: false,
  };

  lastKnownVolume = 0.5;
  ignoredEvents = new Set();
  handlerName = "Default";
  peerService = undefined;
  parentDomService = undefined;
  videoElement = undefined;
  videoDOMObserver = undefined;

  boundSeek = undefined;
  boundPlay = undefined;
  boundPause = undefined;

  constructor(peerService, parentDomService) {
    this.peerService = peerService;
    this.parentDomService = parentDomService;
    this.boundSeek = this.onSeek.bind(this);
    this.boundPause = this.onPause.bind(this);
    this.boundPlay = this.onPlay.bind(this);
  }

  setPlayerState() {
    let isPaused = Boolean(this.videoElement && this.videoElement.paused);
    this.playerState = {
      isPaused,
      isPlaying: !isPaused,
      isMuted: Boolean(this.videoElement && this.videoElement.muted),
    };
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
    this.removeHandlers();
    if (Math.abs(time - this.videoElement.currentTime) < 0.5) {
      console.log(
        "Skipping seek, diff is:",
        Math.abs(time - this.videoElement.currentTime)
      );
    } else {
      await this.performSeek(time);
    }
    await this.addHandlers();
  }

  async performSeek(time) {
    this.videoElement.currentTime = time;
  }

  async play(time) {
    this.removeHandlers();
    await this.performSeek(time);
    await this.performPlay();
    await this.addHandlers();
    this.setPlayerState();
  }

  async performPlay() {
    return await this.videoElement.play();
  }

  async pause() {
    this.removeHandlers();
    await this.performPause();
    await this.addHandlers();
    this.setPlayerState();
  }

  async performPause() {
    return await this.videoElement.pause();
  }

  async performMute() {
    this.lastKnownVolume = this.videoElement.volume;
    this.videoElement.muted = true;
  }

  async performUnmute() {
    this.videoElement.muted = false;
    this.videoElement.volume = this.lastKnownVolume;
  }

  async withDisabledEventPropagation(events, block) {
    events.forEach((event) => this.ignoredEvents.add(event));
    await block.call();
    await timeout(250);
    events.forEach((event) => this.ignoredEvents.delete(event));
  }

  async addListeners() {
    console.log("Adding video listeners...");
    if (isPresent(this.videoElement)) {
      console.log("Removing existing video listeners...");
      this.removeHandlers();
    }

    if (this.videoDOMObserver) {
      this.videoDOMObserver.disconnect();
    }

    this.videoElement = this.getElementReference();

    this.videoDOMObserver = new MutationObserver(
      this.checkForVideoElement.bind(this)
    );

    if (isNone(this.videoElement)) {
      this.videoDOMObserver.observe(
        this.parentDomService.window.document.body,
        {
          childList: true,
          subtree: true,
        }
      );

      return console.error("No video found");
    }

    if (!this.noInitialPause) {
      await this.videoElement.pause();
    }

    this.addHandlers();

    this.videoElement.addEventListener(
      "volumechange",
      this.setPlayerState.bind(this)
    );
    this.videoElement.addEventListener(
      "stalled",
      this.setPlayerState.bind(this)
    );

    this.setPlayerState();

    this.videoDOMObserver.observe(this.parentDomService.window.document.body, {
      childList: true,
      subtree: true,
    });

    console.log("Video listeners added.");
  }

  checkForVideoElement() {
    if (
      isNone(this.videoElement) ||
      !this.parentDomService.window.document.body.contains(this.videoElement)
    ) {
      console.log("Video element lost, attempting to reninitialize");
      throttle(this, this.addListeners, 500);
    }
  }

  onSeek() {
    let message = new RTCMessage({
      event: "video-seek",
      data: {
        time: this.videoElement.currentTime,
      },
    });
    this.peerService.sendRTCMessage(message);
  }

  onPlay() {
    this.setPlayerState();

    let message = new RTCMessage({
      event: "video-play",
      data: {
        time: this.videoElement.currentTime,
      },
    });
    this.peerService.sendRTCMessage(message);
  }

  onPause() {
    this.setPlayerState();
    let message = new RTCMessage({
      event: "video-pause",
      data: {},
    });
    this.peerService.sendRTCMessage(message);
  }

  async addHandlers() {
    await timeout(50);
    this.videoElement.addEventListener("seeked", this.boundSeek);
    this.videoElement.addEventListener("play", this.boundPlay);
    this.videoElement.addEventListener("pause", this.boundPause);
  }

  removeHandlers() {
    if (isPresent(this.videoElement)) {
      this.videoElement.removeEventListener("seeked", this.boundSeek);
      this.videoElement.removeEventListener("play", this.boundPlay);
      this.videoElement.removeEventListener("pause", this.boundPause);
    }
  }
}
