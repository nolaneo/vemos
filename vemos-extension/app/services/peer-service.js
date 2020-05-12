import Service, { inject as service } from "@ember/service";
import Peer from "peerjs";
import { tracked } from "@glimmer/tracking";
import { v4 as uuidv4 } from "uuid";
import { A } from "@ember/array";
import { isNone } from "@ember/utils";
import { later } from "@ember/runloop";

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
  @service metricsService;
  @service logService;

  @tracked peer = undefined;
  @tracked peerId = undefined;
  @tracked connections = A();
  @tracked currentMediaStream;

  eventHandlers = {};
  reconnectionAttempts = {};
  knownEvents = A();
  selfConnectionAttempts = 0;
  knownPeers = new Set();
  reconnectToPeerIds = A();

  initialize() {
    this.connections = A();
    this.reconnectionAttempts = {};
    this.selfConnectionAttempts = 0;
    this.knownEvents = A();

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

  removeEventHandler(eventName, handler) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName].removeObject(handler);
    }
  }

  connectToPeer(peerId) {
    if (peerId === this.peerId) {
      console.error("Refusing to self connect");
    } else {
      let connection = this.peer.connect(peerId);
      this.onPeerConnection(connection);
    }
  }

  callPeer(peerId, mediaStream) {
    this.peer.call(peerId, mediaStream);
  }

  sendRTCMessage(message) {
    this.logService.log(
      `Sending message [event ${message.event} | uuid ${message.uuid}]`
    );
    message.senderId = this.peerId;
    this.connections.forEach((connection) =>
      connection.send(message.serialize())
    );
  }

  onPeerOpen(id) {
    this.logService.log(
      `Connection to signaling server established. Our ID is ${id}`
    );
    this.peerId = id;

    if (this.eventHandlers["did-establish-connection"]) {
      this.eventHandlers["did-establish-connection"].forEach((handler) =>
        handler()
      );
    }

    if (this.reconnectToPeerIds) {
      this.reconnectToPeerIds.forEach((peer) => this.connectToPeer(peer));
    }
  }

  onPeerConnection(connection) {
    let existingConnection = this.connections.find(
      (c) => c.peer === connection.peer
    );
    if (existingConnection) {
      this.connections.removeObject(existingConnection);
    }
    this.connections.pushObject(connection);
    connection.on("open", this.onConnectionOpen.bind(this, connection));
  }

  onPeerDisconnected() {
    console.log("onPeerDisconnected");
    this.logService.log(`You have disconnected, attempting to reconnect`);
    this.attemptReconnectSelf();
  }

  attemptReconnectSelf() {
    if (this.selfConnectionAttempts > 10) {
      this.logService.error(`Giving up on reconnection`);
      this.metricsService.recordMetric("give-up-on-self-reconnect");
      this.fullReconnect();
    }
    this.peer.reconnect();
    this.selfConnectionAttempts++;
    later(
      this,
      () => {
        if (this.peer.disconnected) {
          this.attemptReconnectSelf();
        } else {
          this.metricsService.recordMetric("reconnected-with-server");
          this.selfConnectionAttempts = 0;
          if (this.eventHandlers["self-reconnection"]) {
            this.eventHandlers["self-reconnection"].forEach((handler) =>
              handler()
            );
          }
        }
      },
      2000
    );
  }

  fullReconnect() {
    this.peer.destroy();
    this.initialize();
    this.logService.log("Attempting full reconnect");
    this.metricsService.recordMetric("full-reconnect");
    this.reconnectToPeerIds = Array.from(this.knownPeers);
  }

  onPeerError(error) {
    console.log("onPeerError", error.type, error);
    this.logService.error(`An error occurred: ${error.message}`);
    this.metricsService.recordMetric(`on-peer-error-${error.type}`);
    if (error.type === "peer-unavailable") {
      let peer = error.message.split(" ").lastObject;
      later(this, () => this.attemptReconnectOther(peer), 2000);

      if (this.eventHandlers["peer-unavailable"]) {
        this.eventHandlers["peer-unavailable"].forEach((handler) => handler());
      }
    }

    if (error.type === "network") {
      this.logService.log(`Attemping reconnect: ${error.message}`);
      later(this, () => this.fullReconnect(), 2000);
    }
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
    this.logService.log(`Connection established with ${connection.peer}`);
    let message = new RTCMessage({
      event: "new-peer-joined",
      data: {
        peerId: connection.peer,
      },
    });
    this.sendRTCMessage(message);
    this.metricsService.recordMetric("peer-connection-open");
    this.reconnectionAttempts[connection.peer] = 0;
    if (this.knownPeers.has(connection.peer)) {
      this.metricsService.recordMetric("reconnected-with-peer");
    } else if (connection.peer !== this.peerId) {
      this.knownPeers.add(connection.peer);
    }
    connection.on("data", this.onConnectionData.bind(this, connection));
    connection.on("close", this.onConnectionClose.bind(this, connection));
    connection.on("error", this.onConnectionError.bind(this, connection));

    if (this.eventHandlers["connection-opened"]) {
      this.eventHandlers["connection-opened"].forEach((handler) =>
        handler(connection)
      );
    }
  }

  onConnectionData(connection, message) {
    if (this.knownEvents.includes(message.uuid)) {
      console.log(`Ignoring known event`, event.uuid);
      return;
    }
    this.knownEvents.pushObject(message.uuid);
    if (this.eventHandlers[message.event]) {
      this.logService.log(`Received message [event ${message.event}`);

      console.log(` | uuid ${message.uuid}]`);
      this.eventHandlers[message.event].forEach((handler) => handler(message));
    } else {
      console.log(`No event handlers for ${message.event}`);
    }
  }

  onConnectionClose(connection) {
    this.connections.removeObject(connection);
    console.log("onConnectionClose");
    this.logService.log(
      `A peer has closed their connection ${connection.peer}`
    );
    if (this.eventHandlers["connection-closed"]) {
      this.eventHandlers["connection-closed"].forEach((handler) =>
        handler(connection)
      );
    }
    later(this, () => this.attemptReconnectOther(connection.peer), 2000);
  }

  onConnectionError(connection) {
    console.log("onConnectionError");
    this.logService.error(
      `Connection with peer has been lost. ${connection.peer}`
    );
    this.attemptReconnectOther(connection.peer);
  }

  attemptReconnectOther(peer) {
    this.logService.log(`Attempting reconnection ${peer}`);
    if (this.reconnectionAttempts[peer] > 20) {
      console.log("Giving up on peer");
      this.knownPeers.delete(peer);
      this.metricsService.recordMetric("give-up-on-reconnect");
    } else {
      this.connectToPeer(peer);
      this.reconnectionAttempts[peer] = this.reconnectionAttempts[peer] =
        this.reconnectionAttempts[peer] | 0;
      this.reconnectionAttempts[peer] += 1;
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
