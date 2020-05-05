import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";
import { timeout } from "ember-concurrency";

export default class InviteButtonComponent extends Component {
  @service metricsService;
  @service parentDomService;
  @service peerService;

  @tracked linkText = "Copy invite link";

  @action copyLink() {
    this.generateLink();
  }

  async generateLink() {
    this.metricsService.recordMetric("copied-invite-link");
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
