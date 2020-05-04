import Service, { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import { A } from "@ember/array";
import { isNone, isPresent } from "@ember/utils";
import { later } from "@ember/runloop";
import { RTCMessage } from "./peer-service";

class VemosStream {
  videoCallService = undefined;

  get metricsService() {
    return this.videoCallService.metricsService;
  }

  @tracked isOwnStream;
  @tracked peerId;
  @tracked mediaStream;
  @tracked displayableStream;
  @tracked audioStream;

  @tracked isMuted = false;
  @tracked isHidden = false;

  constructor(inputs) {
    let {
      peerId,
      mediaStream,
      displayableStream,
      audioStream,
      isOwnStream,
      videoCallService,
    } = inputs;
    this.peerId = peerId;
    this.mediaStream = mediaStream;
    this.displayableStream = displayableStream ?? mediaStream;
    this.audioStream = audioStream ?? mediaStream;
    this.isOwnStream = isOwnStream ?? false;
    this.videoCallService = videoCallService;

    this.isMuted = !this.audioStream
      .getAudioTracks()
      .some((track) => track.enabled);
    this.setHiddenState();

    if (isNone(peerId)) {
      throw new Error("Attempt to create a stream with no peer ID specified");
    }

    if (isNone(mediaStream)) {
      throw new Error(
        "Attempt to create a stream with no mediaStream specified"
      );
    }
  }

  stop() {
    try {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.displayableStream.getTracks().forEach((track) => track.stop());
      this.audioStream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error("Error cleaning up media streams", error);
    }
  }

  setHiddenState() {
    let tracks = this.displayableStream.getVideoTracks();
    if (isPresent(tracks)) {
      this.isHidden = !this.displayableStream
        .getVideoTracks()
        .some((track) => track.enabled);
    } else {
      this.isHidden = true;
    }
  }

  toggleAudio(providedState) {
    this.metricsService.recordMetric("toggle-audio");
    let currentState = this.audioStream
      .getAudioTracks()
      .some((track) => track.enabled);
    this.audioStream.getAudioTracks().forEach((track) => {
      track.enabled = providedState ?? !currentState;
    });
    this.isMuted = !this.audioStream
      .getAudioTracks()
      .some((track) => track.enabled);
  }

  toggleVideo(providedState) {
    if (!this.isOwnStream) {
      return console.error("Cannot disable another peers video stream");
    }
    this.metricsService.recordMetric("toggle-video");
    let isEnabled =
      providedState ?? isPresent(this.displayableStream.getVideoTracks());
    if (isEnabled) {
      this.videoCallService.endVideoStream();
      this.disableTracksForStream(this.displayableStream);
      this.disableTracksForStream(this.mediaStream);
      this.isHidden = true;
    } else {
      this.videoCallService.restartVideoStream();
    }
  }

  disableTracksForStream(stream) {
    console.log("disable tracks for stream");
    stream.getVideoTracks().forEach((track) => {
      track.enabled = false;
      later(
        this,
        () => {
          stream.removeTrack(track);
          track.stop();
        },
        100
      );
    });
  }
}

export { VemosStream };

export default class VideoCallServiceService extends Service {
  @service peerService;
  @service parentDomService;
  @service metricsService;

  @tracked activeStreams = A();

  get ownMediaStream() {
    return this.activeStreams.find(
      (stream) => stream.peerId === this.peerService.peerId
    );
  }

  get peerMediaStreams() {
    return this.activeStreams.filter(
      (stream) => stream.peerId !== this.peerService.peerId
    );
  }

  addStream(stream) {
    if (isNone(stream)) {
      throw new Error("No stream provided to addStream");
    }

    let peerId = stream.peerId;
    let existingStream = this.activeStreams.find(
      (existingStream) => existingStream.peerId === peerId
    );

    if (existingStream) {
      console.log(`Replacing existing stream for peer ${stream.peerId}`);
      stream.toggleAudio(!existingStream.isMuted);
      let index = this.activeStreams.indexOf(existingStream);
      this.activeStreams.removeObject(existingStream);
      this.activeStreams.insertAt(index, stream);
      existingStream.stop();
    } else {
      console.log(`Adding new stream for peer ${stream.peerId}`);
      this.activeStreams.pushObject(stream);
    }
  }

  removeStream(peerId) {
    let existingStream = this.activeStreams.find(
      (existingStream) => existingStream.peerId === peerId
    );

    if (existingStream) {
      console.log(`Removing stream for peer ${peerId}`);
      this.activeStreams.removeObject(existingStream);
      existingStream.stop();
    } else {
      console.error(
        `Attempted to remove stream for ${peerId}, but no stream was found`
      );
    }
  }

  async setupMediaStream() {
    let ownMediaStream = await this.getStream();
    let ownMediaStreamNoAudio = ownMediaStream.clone();
    ownMediaStreamNoAudio.getAudioTracks().forEach((track) => {
      ownMediaStreamNoAudio.removeTrack(track);
    });
    let ownVemosStream = new VemosStream({
      peerId: this.peerService.peerId,
      mediaStream: ownMediaStream,
      audioStream: ownMediaStream,
      displayableStream: ownMediaStreamNoAudio,
      isOwnStream: true,
      videoCallService: this,
    });
    this.removeStream(this.peerService.peerId);
    this.addStream(ownVemosStream);
  }

  async restartVideoStream() {
    console.log("Restart video stream");
    await this.setupMediaStream();
    this.ownMediaStream.isHidden = false;
    this.peerService.connections.forEach((connection) => {
      this.peerService.callPeer(
        connection.peer,
        this.ownMediaStream.mediaStream
      );
    });
  }

  async getStream() {
    let settings = {
      video: {
        width: { min: 160, ideal: 320, max: 640 },
        height: { min: 120, ideal: 240, max: 480 },
      },
      audio: true,
    };
    return this.parentDomService.window.navigator.mediaDevices
      .getUserMedia(settings)
      .catch((error) => {
        console.error(error);
        console.error(
          "Could not generate a MediaStream. Returning blank stream"
        );
        return new MediaStream();
      });
  }

  async endVideoStream() {
    let message = new RTCMessage({
      event: "webcam-disabled",
      data: {},
    });
    this.peerService.sendRTCMessage(message);
  }

  disableTracksForPeer(peerId) {
    console.log(`Disable video for ${peerId}`);
    let stream = this.activeStreams.find((stream) => stream.peerId === peerId);
    if (stream) {
      stream.displayableStream
        .getVideoTracks()
        .forEach((track) => stream.displayableStream.removeTrack(track));
      stream.setHiddenState();
    } else {
      console.log(`No stream found for ${peerId} to disable`);
    }
  }
}
