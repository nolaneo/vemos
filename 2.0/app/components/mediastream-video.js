import Component from "@glimmer/component";
import { action } from "@ember/object";

export default class MediastreamVideoComponent extends Component {
  @action setupMediaStream(video) {
    if (this.args.mediaStream) {
      video.srcObject = this.args.mediaStream;
    } else {
      console.log(`Media stream was not provided`);
    }
  }
}
