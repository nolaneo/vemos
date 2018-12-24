import Component from '@ember/component';
import { next } from '@ember/runloop';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'video',
  attributeBindings: ['autoplay'],
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
      video: {width: {exact: 100}, height: {exact: 66}}
    };
    return navigator.mediaDevices.getUserMedia(settings)
    .catch(error => {
      console.error(error);
      console.error('Returning blank stream for local');
      return new MediaStream();
    });
  }),
});
