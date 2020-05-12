import Service from "@ember/service";
import { inject as service } from "@ember/service";
import VideoHandler from "../models/video-handler";
import NetflixHandler from "../models/netflix-handler";
import TwitchHandler from "../models/twitch-handler";
import { tracked } from "@glimmer/tracking";
import { task } from "ember-concurrency-decorators";
import { timeout } from "ember-concurrency";

export default class VideoSyncService extends Service {
  @service peerService;
  @service parentDomService;
  @service metricsService;

  @tracked currentHandler = undefined;

  async initialize() {
    this.currentHandler = new this.handlerClass(
      this.peerService,
      this.parentDomService
    );
    this.currentHandler.addListeners();

    this.peerService.addEventHandler("video-seek", (message) =>
      this.seek.perform(message)
    );
    this.peerService.addEventHandler("video-play", (message) =>
      this.play.perform(message)
    );
    this.peerService.addEventHandler("video-pause", (message) =>
      this.pause.perform(message)
    );
  }

  @task({ drop: true })
  *play(message) {
    this.metricsService.recordMetric("play-received");
    yield this.currentHandler.play(message.data.time);
  }

  @task({ drop: true })
  *pause() {
    this.metricsService.recordMetric("pause-received");
    yield this.currentHandler.pause();
  }

  @task({ drop: true })
  *seek(message) {
    this.metricsService.recordMetric("seek-received");
    yield this.currentHandler.seek(message.data.time);
    yield timeout(100);
  }

  get handlerClass() {
    if (this.parentDomService.window.location.href.includes("netflix.com")) {
      return NetflixHandler;
    } else if (
      this.parentDomService.window.location.href.includes("twitch.tv")
    ) {
      return TwitchHandler;
    } else {
      return VideoHandler;
    }
  }
}
