import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { action } from "@ember/object";

export default class ControlsComponent extends Component {
  @service parentDomService;
  @service videoSyncService;
  @service videoCallService;
  @service metricsService;

  get playerState() {
    return this.videoSyncService.currentHandler.playerState;
  }

  @action play() {
    this.metricsService.recordMetric("controls-play");
    this.videoSyncService.currentHandler.performPlay();
  }

  @action pause() {
    this.metricsService.recordMetric("controls-pause");
    this.videoSyncService.currentHandler.performPause();
  }

  @action muteVolume() {
    this.metricsService.recordMetric("controls-mute-volume");
    this.videoSyncService.currentHandler.performMute();
  }

  @action unmuteVolume() {
    this.metricsService.recordMetric("controls-unmute-volume");
    this.videoSyncService.currentHandler.performUnmute();
  }

  @action toggleCamera() {
    this.metricsService.recordMetric("controls-toggle-camera");
    this.videoCallService.ownMediaStream.toggleVideo();
  }

  @action toggleMic() {
    this.metricsService.recordMetric("controls-toggle-mic");
    this.videoCallService.ownMediaStream.toggleAudio();
  }
}
