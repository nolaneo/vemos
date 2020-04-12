import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
export default class FrameStylesComponent extends Component {
  @service parentDomService;
  @service settingsService;
}
