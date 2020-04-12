import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';
import { isNone } from '@ember/utils';

class VemosStream {
  @tracked peerId;
  @tracked mediaStream;
  @tracked displayableStream;
  @tracked audioStream;

  @tracked isMuted = false;
  @tracked isHidden = false;

  constructor(inputs) {
    let { peerId, mediaStream, displayableStream, audioStream } = inputs;
    this.peerId = peerId;
    this.mediaStream = mediaStream;
    this.displayableStream = displayableStream ?? mediaStream;
    this.audioStream = audioStream ?? mediaStream;

    this.isMuted = !this.audioStream.getAudioTracks().some(track => track.enabled);
    this.isHidden = !this.displayableStream.getVideoTracks().some(track => track.enabled);

    if (isNone(peerId)) {
      throw new Error('Attempt to create a stream with no peer ID specified');
    }

    if (isNone(mediaStream)) {
      throw new Error('Attempt to create a stream with no mediaStream specified');
    }
  }

  toggleAudio(providedState) {
    let currentState = this.audioStream.getAudioTracks().some(track => track.enabled);
    this.audioStream.getAudioTracks().forEach(track => {
      track.enabled = providedState ?? !currentState;
    });
    this.isMuted = !this.audioStream.getAudioTracks().some(track => track.enabled);
  }

  toggleVideo(providedState) {
    let currentState = this.displayableStream.getVideoTracks().some(track => track.enabled);
    this.displayableStream.getVideoTracks().forEach(track => {
      track.enabled = providedState ?? !currentState;
    });

    this.isHidden = !this.displayableStream.getVideoTracks().some(track => track.enabled);

    if (this.displayableStream !== this.mediaStream) {
      this.mediaStream.getVideoTracks().forEach(track => {
        track.enabled = !this.isHidden;
      });
    }
  }
}

export { VemosStream };

export default class VideoCallServiceService extends Service {
  @service peerService;
  @service parentDomService;

  @tracked activeStreams =  A();

  get ownMediaStream() {
    return this.activeStreams.find(stream => stream.peerId === this.peerService.peerId);
  }

  get peerMediaStreams() {
    return this.activeStreams.filter(stream => stream.peerId !== this.peerService.peerId);
  }

  addStream(stream) {
    if (isNone(stream)) {
      throw new Error('No stream provided to addStream');
    }

    let peerId = stream.peerId;
    let existingStream = this.activeStreams.find(existingStream => existingStream.peerId === peerId);

    if (existingStream) {
      console.log(`Replacing existing stream for peer ${stream.peerId}`);
      this.activeStreams.replace(this.activeStreams.indexOf(existingStream), stream);
    } else {
      console.log(`Adding new stream for peer ${stream.peerId}`);
      this.activeStreams.pushObject(stream);
    }
  }

  removeStream(peerId) {
    let existingStream = this.activeStreams.find(existingStream => existingStream.peerId === peerId);

    if (existingStream) {
      console.log(`Removing stream for peer ${peerId}`);
      this.activeStreams.removeObject(existingStream);
    } else {
      console.error(`Attempted to remove stream for ${stream.peerId}, but no stream was found`);
    }
  }

  async setupMediaStream() {
    let settings = {
      video: {
        width: { min: 160, ideal: 320, max: 640 },
        height: { min: 120, ideal: 240, max: 480 },
      },
      audio: true,
    };
    let ownMediaStream = await this.parentDomService.window.navigator.mediaDevices
      .getUserMedia(settings)
      .catch((error) => {
        console.error(error);
        console.error("Could not generate a MediaStream. Returning blank stream");
        return new MediaStream();
      });
    let ownMediaStreamNoAudio = ownMediaStream.clone();
    ownMediaStreamNoAudio.getAudioTracks().forEach((track) => {
      ownMediaStreamNoAudio.removeTrack(track);
    });
    let ownVemosStream = new VemosStream({
      peerId: this.peerService.peerId,
      mediaStream: ownMediaStream,
      audioStream: ownMediaStream,
      displayableStream: ownMediaStreamNoAudio
    });
    this.addStream(ownVemosStream);
  }
}
