import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";
import { scheduleOnce, debounce } from "@ember/runloop";

export default class MediastreamVideoComponent extends Component {
  @service parentDomService;
  @service metricsService;

  @tracked showClickToPlayOverlay = false;

  video = undefined;

  // For testing purposes. Chrome will block videos autoplaying
  // without user interaction. Typically we'll use a "Join" button
  // or interaction with the Vemos button to accommate this. In test
  // mode where Vemos autoboots we need to be able to force this ourselves.
  @action play() {
    this.video.play();
  }

  @action setupMediaStream(video) {
    this.video = video;
    this.setStreamSource();
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
      try {
        await this.video.play();
      } catch (e) {
        if (
          e.message.includes("user didn't interact with the document first")
        ) {
          this.metricsService.recordMetric(
            "mediastream-not-shown-automatically"
          );
          this.showClickToPlayOverlay = true;
        }
      }
    } else {
      console.log(
        `Media stream was not provided from peer ${this.args.vemosStream.peerId}`
      );
      this.video.srcObject = undefined;
    }
  }

  @action enableVideo() {
    this.metricsService.recordMetric("click-to-enable-video");
    this.video.play();
    this.showClickToPlayOverlay = false;
  }

  @action toggleVideo() {
    this.args.vemosStream.toggleVideo();
  }

  @action toggleAudio() {
    this.args.vemosStream.toggleAudio();
  }
}
