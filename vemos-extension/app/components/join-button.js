import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";

export default class JoinButtonComponent extends Component {
  @service metricsService;
  @service parentDomService;
  @service peerService;
  @service router;

  @action join() {
    this.metricsService.recordMetric("ready-to-join-call");
    this.metricsService.recordMetric("peer-specified");
    let peerFromInviteLink = document
      .querySelector("#vemos-peer-id")
      ?.getAttribute("content");
    this.peerService.connectToPeer(peerFromInviteLink);
  }
}
