import Service from "@ember/service";
import { inject as service } from "@ember/service";
import { timeout } from "ember-concurrency";
import VideoHandler from '../models/video-handler';
import NetflixHandler from '../models/netflix-handler';

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
