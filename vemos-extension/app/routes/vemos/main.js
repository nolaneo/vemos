import Route from "@ember/routing/route";
import { inject as service } from "@ember/service";

export default class VemosMainRoute extends Route {
  @service videoSyncService;
  @service videoCallService;
  @service peerService;

  activate() {
    this.videoCallService.initialize();
    this.videoSyncService.initialize();
    if (this.peerService.peerId) {
      this.videoCallService.setupMediaStream();
    } else {
      this.peerService.addEventHandler("did-establish-connection", () =>
        this.videoCallService.setupMediaStream()
      );
    }
  }

  beforeModel() {
    let inviteId = document
      .querySelector("#vemos-peer-id")
      ?.getAttribute("content");
    if (inviteId) {
      this.transitionTo("vemos.main.join");
    } else {
      this.transitionTo("vemos.main.invite");
    }
  }
}
