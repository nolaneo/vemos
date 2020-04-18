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
  @service metricsService;

  @tracked showHeadphoneWarning = true;
  @tracked linkText = "Copy invite link";

  constructor() {
    super(...arguments);
    this.videoSyncService.initialize();
    this.attemptImmediateConnection();
  }

  async attemptImmediateConnection() {
    await timeout(2000);
    let sepecifiedPeer = document
      .querySelector("#vemos-peer-id")
      ?.getAttribute("content");
    if (sepecifiedPeer) {
      this.metricsService.recordMetric("peer-specified");
      console.log("Connecting to peer specified in query param");
      this.peerService.connectToPeer(sepecifiedPeer);
    } else {
      this.metricsService.recordMetric("no-peer-specified");
    }
  }

  @action disableHeadphoneWarning() {
    this.showHeadphoneWarning = false;
  }

  @action copyLink() {
    this.metricsService.recordMetric("copied-invite-link");
    this.videoSyncService.initialize();
    this.generateLink();
  }

  async generateLink() {
    let url = new URL(this.parentDomService.window.location.href);
    url.searchParams.append("vemos-id", this.peerService.peerId);
    navigator.clipboard.writeText(
      "https://vemos.org/connect?destination=" +
        encodeURIComponent(url.toString())
    );
    this.linkText = "Copied!";
    await timeout(2000);
    this.linkText = "Copy invite link";
  }
}
