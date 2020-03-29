import Service from "@ember/service";
import Evented from "@ember/object/evented";
import Peer from "peerjs";

import { none } from "@ember/object/computed";
import { task, timeout } from "ember-concurrency";

const PEER_SERVER_KEY = "lwjd5qra8257b9";

export default Service.extend(Evented, {
  initialize(id = null) {
    let peer = new Peer(id, { key: PEER_SERVER_KEY });
    console.log("Initializing connection service");
    peer.on("open", id => {
      this.set("peerId", id);
      console.log("Peer id: ", id);
    });
    peer.on("connection", connection =>
      this._setupConnection(connection, true)
    );
    this.set("peer", peer);
  },

  initializeStreamingPeer() {
    let peer = new Peer({ key: PEER_SERVER_KEY });
    this.set("streamingPeer", peer);
  },

  isNotConnected: none("connection"),

  _setupConnection(connection, isMaster) {
    console.log("setup connection");
    this.set("remotePeerId", connection.peer);
    this.get("attemptReconnection").cancelAll();
    this.set("connectionClosed", false);
    this.set("isMaster", isMaster);
    this.set("connection", connection);
    connection.on("data", data => this.trigger("received", data));
    connection.on("close", () => {
      this.get("attemptReconnection").perform();
    });
    console.log("connected!");
    this.trigger("connected");
    if (this.get("hadPreviousConnection")) {
      this.trigger("reconnected");
    } else {
      this.set("hadPreviousConnection", true);
    }
  },

  attemptReconnection: task(function*() {
    this.get("peer").destroy();
    yield timeout(1000);
    this.initialize(this.get("peerId"));
    yield timeout(1000);
    if (!this.get("isMaster")) {
      yield timeout(1000);
    }
    console.log("attempting reconnection");
    this.reconnect();
    yield timeout(5000);
    this.set("connectionClosed", true);
    this.trigger("closed");
  }),

  connect(peerId) {
    let connection = this.get("peer").connect(peerId);
    this._setupConnection(connection, false);
  },

  reconnect() {
    if (!this.get("isMaster")) {
      let connection = this.get("peer").connect(this.get("remotePeerId"));
      this._setupConnection(connection, this.get("isMaster"));
    } else {
      console.log("waiting for slave reconnection");
    }
  },

  forceReconnect() {
    this.get("connection").close();
  }
});
