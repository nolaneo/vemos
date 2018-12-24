import Component from '@ember/component';
import { not } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { later } from '@ember/runloop';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  connectionService: service(),
  videoService: service(),

  hasSelectedVideo: false,
  peerHasSelectedVideo: false,

  hasNotSelectedVideo: not('hasSelectedVideo'),
  peerHasNotSelectedVideo: not('peerHasSelectedVideo'),
  peerFileName: null,

  classNameBindings: ['webcamIsMainView:main-video-minimized'],

  didInsertElement() {
    this._super(...arguments);
    this.get('connectionService').initializeStreamingPeer();
    this.get('connectionService').on('received', (data) => this.videoSync(data));
    this.$(document).on('mousemove', () => this.get('showControls').perform());
  },

  willDestroyElement() {
    this.$(document).off('mousemove');
  },

  showControls: task(function * () {
    this.$('video.main-video')[0].controls = true;
    yield timeout(2000);
    this.$('video.main-video')[0].controls = false;
  }).restartable(),

    
  lastSentEvent: null,
  lastEvent: null,

  videoSync(data) {
    if (this.get('ignorePeerEvents')) {
      return console.log(`Ignoring received event: ${data.videoEvent}`);
    }
    let currentPeerEvent = JSON.stringify(data);
    if (currentPeerEvent === this.get('lastSentEvent')) {
      return console.log(`Ignoring rereceived event: ${data.videoEvent}`);
    }
    this.set('lastEvent', data);
    console.log(`Handling received event: ${data.videoEvent}`);
    switch(data.videoEvent) {
      case 'onpause': return this.handleOnPause(data);
      case 'onplay': return this.handleOnPlay(data);
      case 'onseeked': return this.handleOnSeeked(data);
      case 'onselected': return this.handleOnSelected(data);
      case 'streamingRequested': return this.handleStreamingRequested(data);
      case 'streamingAccepted': return this.handleStreamingAccepted(data);
    }
  },

  handleOnSelected(data) {
    this.set('peerHasSelectedVideo', true);
    this.set('peerFileName', data.name);
  },

  handleOnPlay(data) {
    this.get('showControls').perform();
    this.$('video')[0].play();
    this.$('video')[0].currentTime = data.timestamp;
  },

  handleOnPause(data) {
    this.get('showControls').perform();
    this.$('video')[0].pause();
    this.$('video')[0].currentTime = data.timestamp;
  },

  handleOnSeeked(data) {
    this.get('showControls').perform();
    this.$('video')[0].currentTime = data.timestamp;
  },

  handleStreamingRequested(data) {
    this.set('connectionService.destinationStreamingPeer', data.streamingPeerId);
    this.sendEvent({
      videoEvent: 'streamingAccepted',
      streamingPeerId: this.get('connectionService.streamingPeer.id'),
    });
    this.get('connectionService.streamingPeer').on('call', (call) => {
      call.answer();
      call.on('stream', mediaStream => {
        this.$('video.main-video')[0].srcObject = mediaStream;
        this.get('videoService').setMainStream(mediaStream);
        this.set('hasSelectedVideo', true);
        this.set('peerHasSelectedVideo', true);
      })
    });
  },

  handleStreamingAccepted(data) {
    this.set('connectionService.destinationStreamingPeer', data.streamingPeerId);
    let mediaStream = this.$('video.main-video')[0].captureStream()
    this.get('connectionService.streamingPeer').call(
      this.get('connectionService.destinationStreamingPeer'),
      mediaStream
    );
    this.set('peerHasSelectedVideo', true);
  },

  sendEvent(event) {
    if (!event.videoEvent.startsWith('streaming')) {
      this.set('ignorePeerEvents', true);
    }
    this.set('lastSentEvent', JSON.stringify(event));
    this.get('connectionService.connection').send(event);
    later(this, () => this.set('ignorePeerEvents', false), 250);
  },

  actions: {
    setVideo(event) {
      let file = event.currentTarget.files[0];
      let videoNode = this.$('video.main-video')[0];
      videoNode.src = URL.createObjectURL(file);
      this.get('videoService').setMainStream(this.$('video.main-video')[0].captureStream());
      this.set('hasSelectedVideo', true);
      this.get('connectionService.connection').send({
        videoEvent: 'onselected',
        name: file.name
      });
    },

    onPlay() {
      this.sendEvent({
        videoEvent: 'onplay',
        timestamp: this.$('video')[0].currentTime
      });
    },

    onPause() {
      this.sendEvent({
        videoEvent: 'onpause',
        timestamp: this.$('video')[0].currentTime
      });
    },

    onSeeked() {
      if (this.get('lastEvent.timestamp') === this.$('video')[0].currentTime) {
        return console.log('ignoring seeked event');
      }
      this.sendEvent({
        videoEvent: 'onseeked',
        timestamp: this.$('video')[0].currentTime
      });
    },

    requestStreamingPeerDetails() {
      this.sendEvent({
        videoEvent: 'streamingRequested',
        streamingPeerId: this.get('connectionService.streamingPeer.id'),
      });
    },
  }
});
