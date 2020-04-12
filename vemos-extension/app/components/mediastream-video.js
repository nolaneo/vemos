import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";

export default class MediastreamVideoComponent extends Component {
  @service parentDomService;

  @action setupMediaStream(video) {
    if (this.args.vemosStream.displayableStream && !this.args.vemosStream.isHidden) {
      video.srcObject = this.args.vemosStream.displayableStream;
    } else {
      console.log(`Media stream was not provided from peer ${this.args.vemosStream.peerId}`);
      video.srcObject = undefined;
    }
  }

  @action toggleVideo() {
    this.args.vemosStream.toggleVideo();
  }

  @action toggleAudio() {
    this.args.vemosStream.toggleAudio();
  }
}
