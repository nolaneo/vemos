import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";

export default class JoinButtonComponent extends Component {
  @service metricsService;
  @service parentDomService;
  @service peerService;
  @service router;

  @tracked peerUnavailable = false;
  @tracked linkText = "Join now!";

  @action join() {
    this.peerUnavailable = false;
    this.metricsService.recordMetric("ready-to-join-call");
    this.metricsService.recordMetric("peer-specified");
    let peerFromInviteLink = document
      .querySelector("#vemos-peer-id")
      ?.getAttribute("content");
    this.peerService.addEventHandler(
      "peer-unavailable",
      this.onPeerUnavailable.bind(this)
    );
    this.linkText = "Joining...";
    this.peerService.connectToPeer(peerFromInviteLink);
  }

  @action destroy() {
    this.peerService.removeEventHandler(
      "peer-unavailable",
      this.onPeerUnavailable.bind(this)
    );
  }

  onPeerUnavailable() {
    this.linkText = "Join now!";
    this.metricsService.recordMetric("peer-error-shown");
    this.peerUnavailable = true;
  }
}
