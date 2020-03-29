import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { action } from "@ember/object";
import { RTCMessage } from "../services/peer-service";

export default class StartPageComponent extends Component {
  @service peerService;

  hostId = "";
  message = "";

  constructor() {
    super(...arguments);
    this.peerService.addEventHandler("chat", message => {
      console.log("received:", message.data.text);
    });
  }

  @action hmm() {
    console.log("hmm");
  }

  @action testConnection() {
    console.log(`testConnection`, this.hostId);
    this.peerService.connectToPeer(this.hostId);
  }

  @action sendMessage() {
    console.log(`sendMessage`);
    let message = new RTCMessage({
      event: "chat",
      data: {
        text: this.message
      }
    });
    this.peerService.sendRTCMessage(message);
  }
}
