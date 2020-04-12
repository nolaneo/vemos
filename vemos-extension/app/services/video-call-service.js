import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';
import { isNone, isPresent } from '@ember/utils';

class VemosStream {
  videoCallService = undefined;
  @tracked isOwnStream;
  @tracked peerId;
  @tracked mediaStream;
  @tracked displayableStream;
  @tracked audioStream;

  @tracked isMuted = false;
  @tracked isHidden = false;

  constructor(inputs) {
    let { peerId, mediaStream, displayableStream, audioStream, isOwnStream, videoCallService } = inputs;
    this.peerId = peerId;
    this.mediaStream = mediaStream;
    this.displayableStream = displayableStream ?? mediaStream;
    this.audioStream = audioStream ?? mediaStream;
    this.isOwnStream = isOwnStream ?? false;
    this.videoCallService = videoCallService;

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
    if (!this.isOwnStream) {
      return console.error('Cannot disable another peers video stream');
    }
    let isEnabled = providedState ?? isPresent(this.displayableStream.getVideoTracks());
    if (isEnabled) {
      this.displayableStream.getVideoTracks().forEach(track => {
        this.displayableStream.removeTrack(track);
        this.mediaStream.removeTrack(track);
        track.stop();
      });
      this.mediaStream.getVideoTracks().forEach(track => {
        this.mediaStream.removeTrack(track);
        track.stop();
      });
      this.isHidden = true;
    } else {
      this.videoCallService.restartStream();
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
      this.activeStreams = this.activeStreams; // Force ember to see the change to this
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
      videoCallService: this
    });
    this.addStream(ownVemosStream);
  }

  async restartStream() {
    let stream = await this.getStream();
    stream.getVideoTracks().forEach(track => {
      this.ownMediaStream.mediaStream.addTrack(track);
      this.ownMediaStream.displayableStream.addTrack(track);
    });
    this.ownMediaStream.isHidden = false;
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
        console.error("Could not generate a MediaStream. Returning blank stream");
        return new MediaStream();
      });
  }
}
