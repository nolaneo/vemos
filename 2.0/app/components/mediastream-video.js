import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";

export default class MediastreamVideoComponent extends Component {
  @tracked isMuted = false;
  @service parentDomService;

  @action setupMediaStream(video) {
    if (this.args.mediaStream) {
      video.srcObject = this.args.mediaStream;
    } else {
      console.log(`Media stream was not provided`);
    }
  }

  get audioStream() {
    return this.args.mutableVideoStream || this.args.mediaStream;
  }

  @action toggleMute() {
    let currentState = this.audioStream.getAudioTracks()[0].enabled;
    this.audioStream.getAudioTracks()[0].enabled = !currentState;
    this.isMuted = !this.audioStream.getAudioTracks()[0].enabled;
  }
}
