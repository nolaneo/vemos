import Route from "@ember/routing/route";
import { inject as service } from "@ember/service";

export default class VemosMainJoinRoute extends Route {
  @service peerService;

  activate() {
    this.peerService.addEventHandler(
      "new-peer-joined",
      this.trasnsitionToConnected.bind(this)
    );
  }

  deactivate() {
    this.peerService.removeEventHandler(
      "new-peer-joined",
      this.trasnsitionToConnected.bind(this)
    );
  }

  trasnsitionToConnected() {
    this.transitionTo("vemos.main.connected");
  }
}
