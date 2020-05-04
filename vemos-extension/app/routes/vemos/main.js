import Route from "@ember/routing/route";
import { inject as service } from "@ember/service";

export default class VemosMainRoute extends Route {
  @service videoSyncService;

  activate() {
    this.videoSyncService.initialize();
  }
}
