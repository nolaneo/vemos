import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { timeout } from "ember-concurrency";

export default class StartPageComponent extends Component {
  @service peerService;
  @service videoSyncService;
  @service parentDomService;
  @service settingsService;

  @tracked showHeadphoneWarning = true;
  @tracked linkText = "Copy invite link";

  constructor() {
    super(...arguments);
    this.videoSyncService.initialize();
    this.attemptImmediateConnection();
  }

  async attemptImmediateConnection() {
    await timeout(2000);
    if (this.parentDomService.window.VEMOS_PEER_ID) {
      console.log("Connecting to peer specified in query param");
      this.peerService.connectToPeer(
        this.parentDomService.window.VEMOS_PEER_ID
      );
    }
  }

  @action disableHeadphoneWarning() {
    this.showHeadphoneWarning = false;
  }

  @action copyLink() {
    this.videoSyncService.initialize();
    this.generateLink();
  }

  async generateLink() {
    let url = new URL(this.parentDomService.window.location.href);
    url.searchParams.append("vemos-id", this.peerService.peerId);
    navigator.clipboard.writeText(url.toString());
    this.linkText = "Copied!";
    await timeout(2000);
    this.linkText = "Copy invite link";
  }
}
