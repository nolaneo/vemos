import Service from '@ember/service';

export default Service.extend({
  mainStream: null,
  setMainStream(mediaStream) {
    this.set('mainStream', mediaStream);
  }
});
