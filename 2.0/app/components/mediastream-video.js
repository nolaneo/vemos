import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";

export default class MediastreamVideoComponent extends Component {
  @tracked isMuted = false;

  @action setupMediaStream(video) {
    if (this.args.mediaStream) {
      video.srcObject = this.args.mediaStream;
    } else {
      console.log(`Media stream was not provided`);
    }
  }

  @action toggleMute() {
    let currentState = this.args.mediaStream.getAudioTracks()[0].enabled;
    this.args.mediaStream.getAudioTracks()[0].enabled = !currentState;
    this.isMuted = !currentState;
  }
}
