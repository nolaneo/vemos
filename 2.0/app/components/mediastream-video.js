import Component from "@glimmer/component";
import { action } from "@ember/object";

export default class MediastreamVideoComponent extends Component {
  @action setupMediaStream(video) {
    video.srcObject = this.args.mediaStream;
  }
}
