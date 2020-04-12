import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { action } from "@ember/object";
import { VemosStream } from '../services/video-call-service';
export default class VideoListComponent extends Component {
  @service peerService;
  @service parentDomService;
  @service videoCallService;

  constructor() {
    super(...arguments);

    this.setupOwnStream();

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

  @action setupOwnStream() {
    console.log('Video list - setupOwnStream');
    if (this.peerService.peerId) {
      this.videoCallService.setupMediaStream();
    }
  }

  answerPeerCall(call) {
    console.log("answerPeerCall", call);
    call.answer(this.videoCallService.ownMediaStream.mediaStream);
  }

  connectPeerStream(call, mediaStream) {
    console.log("connectPeerStream", mediaStream);
    let stream = new VemosStream({
      peerId: call.peer,
      mediaStream,
    })
    this.videoCallService.addStream(stream);
  }

  callPeer(connection) {
    console.log("callPeer");
    this.peerService.callPeer(connection.peer, this.videoCallService.ownMediaStream.mediaStream);
  }

  removePeerStream(connection) {
    console.log("removePeerStream", connection);
    this.videoCallService.removeStream(conneciton.peer);
  }
}
