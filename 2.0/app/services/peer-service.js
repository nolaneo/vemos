import Service from "@ember/service";
import Peer from "peerjs";
import { tracked } from "@glimmer/tracking";
import { v4 as uuidv4 } from "uuid";
import { A } from "@ember/array";

const HOST = "vemos.herokuapp.com";

class RTCMessage {
  uuid = undefined;
  event = undefined;
  data = undefined;

  constructor(inputs) {
    let { event, data } = inputs;
    this.uuid = uuidv4();
    this.event = event;
    this.data = data;
  }

  serialize() {
    let { uuid, event, data } = this;
    return {
      uuid,
      event,
      data
    };
  }
}

export { RTCMessage };

export default class PeerService extends Service {
  @tracked peer = undefined;
  @tracked peerId = undefined;
  @tracked connections = A();

  receivedEvents = A();

  initialize() {
    console.log(`Initializing Peer Service`);
    this.peer = new Peer({
      host: HOST
    });
    this.peer.on("open", this.onPeerOpen.bind(this));
    this.peer.on("connection", this.onPeerConnection.bind(this));
    this.peer.on("disconnected", this.onPeerDisconnected.bind(this));
    this.peer.on("error", this.onPeerError.bind(this));
    this.peer.on("call", this.onPeerCall.bind(this));
  }

  connectToHost(hostId) {
    let connection = this.peer.connect(hostId);
    this.onPeerConnection(connection);
  }

  sendRTCMessage(rtcMessage) {
    console.log(
      `Sending message [event ${rtcMessage.event} | uuid ${rtcMessage.uuid}]`
    );
    this.connections.forEach(connection =>
      connection.send(rtcMessage.serialize())
    );
  }

  onPeerOpen(id) {
    console.log("onPeerOpen", id);
    this.peerId = id;
  }

  onPeerConnection(connection) {
    console.log("onPeerConnection", connection);
    this.connections.pushObject(connection);
    connection.on("open", this.onConnectionOpen.bind(this, connection));
  }

  onPeerDisconnected() {
    console.log("onPeerDisconnected");
  }

  onPeerError(error) {
    console.log("onPeerError", error);
  }

  onPeerCall(call) {
    console.log("onPeerCall", call);
  }

  onConnectionOpen(connection) {
    console.log("onConnectionOpen");
    connection.on("data", this.onConnectionData.bind(this, connection));
    connection.on("close", this.onConnectionClose.bind(this, connection));
  }

  onConnectionData(connection, data) {
    console.log("onConnectionData", connection, data);
  }

  onConnectionClose(connection) {
    this.connections.removeObject(connection);
    console.log("onConnectionClose");
  }
}
