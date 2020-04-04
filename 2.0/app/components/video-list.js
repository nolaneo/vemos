import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import { A } from "@ember/array";

export default class VideoListComponent extends Component {
  @service peerService;
  @service parentDomService;

  @tracked ownMediaStream;
  @tracked ownMediaStreamNoAudio;
  @tracked peerMediaStreams = {};

  constructor() {
    super(...arguments);

    this.setupMediaStream();
    this.peerService.addEventHandler(
      "peer-call",
      this.answerPeerCall.bind(this)
    );
    this.peerService.addEventHandler(
      "on-stream",
      this.connectPeerStream.bind(this)
    );
    this.peerService.addEventHandler(
      "connection-opened",
      this.callPeer.bind(this)
    );
    this.peerService.addEventHandler(
      "connection-closed",
      this.removePeerStream.bind(this)
    );
  }

  get peerStreamList() {
    return Object.values(this.peerMediaStreams);
  }

  answerPeerCall(call) {
    console.log("answerPeerCall", call);
    call.answer(this.mediaStream);
  }

  connectPeerStream(call, mediaStream) {
    console.log("connectPeerStream", mediaStream);
    this.peerMediaStreams[call.peer] = mediaStream;
    this.peerMediaStreams = Object.assign(this.peerMediaStreams);
  }

  callPeer(connection) {
    console.log("callPeer");
    this.peerService.callPeer(connection.peer, this.ownMediaStream);
  }

  removePeerStream(connection) {
    console.log("removePeerStream", connection);
    delete this.peerMediaStreams[connection.peer];
    this.peerMediaStreams = Object.assign(this.peerMediaStreams);
  }

  async setupMediaStream() {
    let settings = {
      video: {
        width: { min: 160, ideal: 320, max: 640 },
        height: { min: 120, ideal: 240, max: 480 },
      },
      audio: true,
    };
    this.ownMediaStream = await this.parentDomService.window.navigator.mediaDevices
      .getUserMedia(settings)
      .catch((error) => {
        console.error(error);
        console.error("Returning blank stream");
        return new MediaStream();
      });
    this.ownMediaStreamNoAudio = this.ownMediaStream.clone();
    this.ownMediaStreamNoAudio.getAudioTracks().forEach((track) => {
      this.ownMediaStreamNoAudio.removeTrack(track);
    });
  }
}
