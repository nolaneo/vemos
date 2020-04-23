import Service from "@ember/service";
import { inject as service } from "@ember/service";
import { timeout } from "ember-concurrency";
import VideoHandler from "../models/video-handler";
import NetflixHandler from "../models/netflix-handler";

export default class VideoSyncService extends Service {
  @service peerService;
  @service parentDomService;
  @service metricsService;

  currentHandler = undefined;

  async initialize() {
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
    this.metricsService.recordMetric("play-received");
    await this.currentHandler.play(message.data.time);
  }

  async pause() {
    this.metricsService.recordMetric("pause-received");
    await this.currentHandler.pause();
  }

  async seek(message) {
    this.metricsService.recordMetric("seek-received");
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
