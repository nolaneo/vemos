import Component from '@ember/component';
import { next } from '@ember/runloop';
import { computed } from '@ember/object';

export default Component.extend({
  didInsertElement() {
    this._super(...arguments);
    next(this, this.setupStream);
  },

  async setupStream() {
    let mediaStream = await this.get('mediaStream');
    this.$('video')[0].srcObject = mediaStream;
  },

  mediaStream: computed(function() {
    let settings = {
      video: {width: {exact: 160}, height: {exact: 120}}
    };
    return navigator.mediaDevices.getUserMedia(settings)
    .catch(error => {
      console.error(error);
      console.error('Returning blank stream for local');
      return new MediaStream();
    });
  }),
});
