import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { timeout } from "ember-concurrency";
import { isNone } from "@ember/utils";

export default class StartPageComponent extends Component {
  @service peerService;
  @service videoSyncService;
  @service parentDomService;
  @service settingsService;
  @service metricsService;
  @service videoCallService;

  @tracked showHeadphoneWarning = true;
  @tracked linkText = "Copy invite link";
  @tracked isJoining = false;

  @tracked peerFromInviteLink;
  @tracked readyToJoin = false;

  constructor() {
    super(...arguments);
    this.peerFromInviteLink = document
      .querySelector("#vemos-peer-id")
      ?.getAttribute("content");

    if (isNone(this.peerFromInviteLink)) {
      this.readyToJoin = true;
    }

    this.videoSyncService.initialize();
    if (this.peerService.peerId) {
      this.videoCallService.setupMediaStream();
    } else {
      this.peerService.addEventHandler("did-establish-connection", () =>
        this.videoCallService.setupMediaStream()
      );
    }
  }

  @action attemptConnection() {
    this.readyToJoin = true;
    this.metricsService.recordMetric("ready-to-join-call");
    this.attemptImmediateConnection();
  }

  async attemptImmediateConnection() {
    if (this.peerFromInviteLink) {
      this.metricsService.recordMetric("peer-specified");
      console.log("Connecting to peer specified in query param");
      this.peerService.connectToPeer(this.peerFromInviteLink);
      this.isJoining = true;
      await timeout(3000);
      this.isJoining = false;
    } else {
      this.metricsService.recordMetric("no-peer-specified");
    }
  }

  @action disableHeadphoneWarning() {
    this.showHeadphoneWarning = false;
  }

  @action copyLink() {
    this.metricsService.recordMetric("copied-invite-link");
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
