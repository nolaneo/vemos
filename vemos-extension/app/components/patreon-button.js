import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { action } from "@ember/object";

export default class PatreonButtonComponent extends Component {
  @service videoSyncService;
  @service metricsService;

  get playerState() {
    return this.videoSyncService.currentHandler.playerState;
  }

  @action onClick() {
    this.metricsService.recordMetric("clicked-patreon-link");
  }
}
