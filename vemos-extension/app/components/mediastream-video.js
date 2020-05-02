import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";
import { scheduleOnce } from "@ember/runloop";

export default class MediastreamVideoComponent extends Component {
  @service parentDomService;

  video = undefined;

  @action setupMediaStream(video) {
    this.video = video;
    scheduleOnce("afterRender", this, this.setStreamSource);
  }

  @action onStreamInserted() {
    if (this.args.onStreamInserted) {
      this.args.onStreamInserted();
    }
  }

  async setStreamSource() {
    console.log(
      "setupMediaStream video component. Is hidden:",
      this.args.vemosStream.isHidden
    );
    if (
      this.args.vemosStream.displayableStream &&
      !this.args.vemosStream.isHidden
    ) {
      this.video.srcObject = this.args.vemosStream.displayableStream;
      await this.video.play();
    } else {
      console.log(
        `Media stream was not provided from peer ${this.args.vemosStream.peerId}`
      );
      this.video.srcObject = undefined;
    }
  }

  @action toggleVideo() {
    this.args.vemosStream.toggleVideo();
  }

  @action toggleAudio() {
    this.args.vemosStream.toggleAudio();
  }
}
