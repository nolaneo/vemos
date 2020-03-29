import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { next, later } from '@ember/runloop';

export default Component.extend({
  tagName: 'video',
  style: 'width: 320px; height: 240px',
  attributeBindings: ['autoplay', 'style'],
  autoplay: true,

  connectionService: service(),
  settingsService: service(),

  classNameBindings: ['settingsService.webcamIsMainView:webcam-main-view'],

  didInsertElement() {
    this._super(...arguments);
    next(this, this.setupStream);
    this.get('connectionService').on('reconnected', () => {
      this.get('call').close();
      console.log('reinstating webcam stream');
      this.setupStream();
    });
  },

  async setupStream() {
    let mediaStream = await this.get('mediaStream');
    if (this.get('connectionService.isMaster')) {
      let call = this.get('connectionService.peer').call(
        this.get('connectionService.connection.peer'),
        mediaStream
      );
      this.setupPeerVideo(call);
    } else {
      this.get('connectionService.peer').on('call', (call) => {
        call.answer(mediaStream);
        this.setupPeerVideo(call);
      });
    }
  },

  mediaStream: computed(function() {
    let settings = {
      video: {
        width: { min: 160, ideal: 320, max: 640 },
        height: { min: 120, ideal: 240, max: 480 },
      },
      audio: true,
    };
    return navigator.mediaDevices.getUserMedia(settings)
    .catch(error => {
      console.error(error);
      console.error('Returning blank stream');
      return new MediaStream();
    });
  }),

  setupPeerVideo(call) {
    this.set('call', call);
    call.on('stream', stream => {
      this.$()[0].srcObject = stream;
    });
  }
});
