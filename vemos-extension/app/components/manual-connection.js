import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";
import { timeout } from "ember-concurrency";
export default class ManualConnectionComponent extends Component {
  @service peerService;
  @service parentDomService;
  @service metricsService;

  @tracked linkText = null;
  @tracked peerCode = null;

  @action openModal() {
    this.parentDomService.activeFrame = "manual-connection";
    this.metricsService.recordMetric("toggled-manual-peer-connection");
    this.showModal = !this.showModal;
  }

  @action closeModal() {
    this.parentDomService.activeFrame = undefined;
  }

  @action copyPeerId() {
    this.runCopyId();
  }

  async runCopyId() {
    this.parentDomService.window.navigator.clipboard.writeText(
      this.peerService.peerId
    );
    this.linkText = "Copied!";
    await timeout(2000);
    this.linkText = this.peerService.peerId;
  }

  @action setPeerCode(input) {
    this.peerCode = input.target.value.trim();
  }

  @action connectToPeer() {
    this.peerService.connectToPeer(this.peerCode);
    this.metricsService.recordMetric("manual-peer-connection");
    this.closeModal();
  }
}
