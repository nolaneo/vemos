import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";

export default class HeadphoneWarningComponent extends Component {
  @service parentDomService;

  @action onInsert() {
    this.parentDomService.activeFrame = "headphone-warning";
  }

  @action onClose() {
    this.parentDomService.activeFrame = undefined;
  }
}
