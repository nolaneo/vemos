import Service from "@ember/service";
import Peer from "peerjs";
import { tracked } from "@glimmer/tracking";
import { v4 as uuidv4 } from "uuid";
import { A } from "@ember/array";
import { isNone } from "@ember/utils";

const HOST = "vemos.herokuapp.com";

class RTCMessage {
  uuid = undefined;
  event = undefined;
  data = undefined;
  senderId = undefined;

  constructor(inputs) {
    let { event, data } = inputs;
    this.uuid = uuidv4();
    this.event = event;
    this.data = data;
  }

  serialize() {
    let { uuid, event, data, senderId } = this;
    return {
      uuid,
      event,
      data,
      senderId,
    };
  }
}

export { RTCMessage };

export default class PeerService extends Service {
  @tracked peer = undefined;
  @tracked peerId = undefined;
  @tracked connections = A();
  @tracked currentMediaStream;

  eventHandlers = {};
  knownEvents = A();

  initialize() {
    console.log(`Initializing Peer Service`);
    this.peer = new Peer({
      host: HOST,
    });
    this.peer.on("open", this.onPeerOpen.bind(this));
    this.peer.on("connection", this.onPeerConnection.bind(this));
    this.peer.on("disconnected", this.onPeerDisconnected.bind(this));
    this.peer.on("error", this.onPeerError.bind(this));
    this.peer.on("call", this.onPeerCall.bind(this));
    this.addEventHandler(
      "new-peer-joined",
      this.handleNewConnection.bind(this)
    );
  }

  addEventHandler(eventName, handler) {
    if (isNone(this.eventHandlers[eventName])) {
      this.eventHandlers[eventName] = A();
    }
    this.eventHandlers[eventName].pushObject(handler);
  }

  connectToPeer(peerId) {
    let connection = this.peer.connect(peerId);
    this.onPeerConnection(connection);
  }

  callPeer(peerId, mediaStream) {
    this.peer.call(peerId, mediaStream);
  }

  sendRTCMessage(message) {
    console.log(
      `Sending message [event ${message.event} | uuid ${message.uuid}]`
    );
    message.senderId = this.peerId;
    this.connections.forEach((connection) =>
      connection.send(message.serialize())
    );
  }

  onPeerOpen(id) {
    console.log("onPeerOpen", id);
    this.peerId = id;
  }

  onPeerConnection(connection) {
    console.log("onPeerConnection", connection);
    let message = new RTCMessage({
      event: "new-peer-joined",
      data: {
        peerId: connection.peer,
      },
    });
    this.sendRTCMessage(message);
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
    if (this.eventHandlers["peer-call"]) {
      this.eventHandlers["peer-call"].forEach((handler) => handler(call));
    }
    call.on("stream", this.onStream.bind(this, call));
  }

  onStream(call, mediaStream) {
    console.log("onStream", call, mediaStream);
    if (this.eventHandlers["on-stream"]) {
      this.eventHandlers["on-stream"].forEach((handler) =>
        handler(call, mediaStream)
      );
    } else {
      console.log(`No event handlers for 'on-stream'`);
    }
  }

  onConnectionOpen(connection) {
    console.log("onConnectionOpen");
    connection.on("data", this.onConnectionData.bind(this, connection));
    connection.on("close", this.onConnectionClose.bind(this, connection));

    if (this.eventHandlers["connection-opened"]) {
      this.eventHandlers["connection-opened"].forEach((handler) =>
        handler(connection)
      );
    }
  }

  onConnectionData(connection, message) {
    console.log("onConnectionData", connection, message);
    if (this.knownEvents.includes(message.uuid)) {
      console.log(`Ignoring known event`, event.uuid);
      return;
    }
    this.knownEvents.pushObject(message.uuid);
    if (this.eventHandlers[message.event]) {
      console.log(
        `Received message [event ${message.event} | uuid ${message.uuid}]`
      );
      this.eventHandlers[message.event].forEach((handler) => handler(message));
    } else {
      console.log(`No event handlers for ${message.event}`);
    }
  }

  onConnectionClose(connection) {
    this.connections.removeObject(connection);
    console.log("onConnectionClose");

    if (this.eventHandlers["connection-closed"]) {
      this.eventHandlers["connection-closed"].forEach((handler) =>
        handler(connection)
      );
    }
  }

  handleNewConnection(message) {
    let peerId = message.data.peerId;
    if (this.connections.mapBy("peer").includes(peerId)) {
      console.log(
        `Ignoring new peer join as we're already connected [${peerId}]`
      );
      return;
    }
    this.connectToPeer(peerId);
  }
}
