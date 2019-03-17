import Component from '@ember/component';
import { next } from '@ember/runloop';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'video',
  style: 'width: 100px; height: 66px;',
  attributeBindings: ['autoplay', 'style'],
  autoplay: true,


  didInsertElement() {
    this._super(...arguments);
    next(this, this.setupStream);
  },

  async setupStream() {
    let mediaStream = await this.get('mediaStream');
    this.$()[0].srcObject = mediaStream;
  },

  mediaStream: computed(function() {
    let settings = {
      video: {
        width: { min: 50, ideal: 100, max: 320 },
        height: { min: 33, ideal: 66, max: 240 }
      }
    };
    return navigator.mediaDevices.getUserMedia(settings)
    .catch(error => {
      console.error(error);
      console.error('Returning blank stream for local');
      return new MediaStream();
    });
  }),
});
