import Route from "@ember/routing/route";
import { inject as service } from "@ember/service";

export default class VemosMainRoute extends Route {
  @service videoSyncService;
  @service videoCallService;
  @service peerService;

  activate() {
    this.videoSyncService.initialize();
    if (this.peerService.peerId) {
      this.videoCallService.setupMediaStream();
    } else {
      this.peerService.addEventHandler("did-establish-connection", () =>
        this.videoCallService.setupMediaStream()
      );
    }
  }
}
