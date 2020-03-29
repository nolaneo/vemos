import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { action } from "@ember/object";

export default class StartPageComponent extends Component {
  @service peerService;

  hostId = "";

  @action hmm() {
    console.log("hmm");
  }

  @action testConnection() {
    console.log(`testConnection`, this.hostId);
    this.peerService.connectToHost(this.hostId);
  }
}
