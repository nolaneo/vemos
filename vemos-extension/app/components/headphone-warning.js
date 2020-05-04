import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";

export default class HeadphoneWarningComponent extends Component {
  @tracked showHeadphoneWarning = true;

  @action onClose() {
    this.showHeadphoneWarning = false;
  }
}
