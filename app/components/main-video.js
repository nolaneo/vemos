import Component from '@ember/component';
import { not } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { later } from '@ember/runloop';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  connectionService: service(),

  hasSelectedVideo: false,
  peerHasSelectedVideo: false,

  hasNotSelectedVideo: not('hasSelectedVideo'),
  peerHasNotSelectedVideo: not('peerHasSelectedVideo'),
  peerFileName: null,


  didInsertElement() {
    this._super(...arguments);
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

  videoSync(data) {
    if (this.get('ignorePeerEvents')) {
      return console.log(`Ignoring received event: ${data.videoEvent}`);
    }
    console.log(`Handling received event: ${data.videoEvent}`);
    switch(data.videoEvent) {
      case 'onpause': return this.handleOnPause(data);
      case 'onplay': return this.handleOnPlay(data);
      case 'onseeked': return this.handleOnSeeked(data);
      case 'onselected': return this.handleOnSelected(data);
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
  
  actions: {
    setVideo(event) {
      let file = event.currentTarget.files[0];
      let videoNode = this.$('video')[0];
      videoNode.src = URL.createObjectURL(file);
      this.set('hasSelectedVideo', true);
      this.get('connectionService.connection').send({
        videoEvent: 'onselected',
        name: file.name
      });
    },

    onPlay() {
      this.set('ignorePeerEvents', true);
      this.get('connectionService.connection').send({
        videoEvent: 'onplay',
        timestamp: this.$('video')[0].currentTime
      });
      later(this, () => this.set('ignorePeerEvents', false), 100);
    },

    onPause() {
      this.set('ignorePeerEvents', true);
      this.get('connectionService.connection').send({
        videoEvent: 'onpause',
        timestamp: this.$('video')[0].currentTime
      });
      later(this, () => this.set('ignorePeerEvents', false), 100);

    },

    onSeeked() {
      this.set('ignorePeerEvents', true);
      this.get('connectionService.connection').send({
        videoEvent: 'onseeked',
        timestamp: this.$('video')[0].currentTime
      });
      later(this, () => this.set('ignorePeerEvents', false), 100);
    }
  }
});
