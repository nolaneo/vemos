import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { action } from "@ember/object";

export default class ControlsComponent extends Component {
  @service parentDomService;
  @service videoSyncService;

  get playerState() {
    return this.videoSyncService.currentHandler.playerState;
  }

  @action play() {
    this.videoSyncService.currentHandler.performPlay();
  }

  @action pause() {
    this.videoSyncService.currentHandler.performPause();
  }

  @action muteVolume() {
    this.videoSyncService.currentHandler.performMute();
  }

  @action unmuteVolume() {
    this.videoSyncService.currentHandler.performUnmute();
  }
}
