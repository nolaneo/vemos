import Component from '@ember/component';

export default Component.extend({
  actions: {
    setVideo(event) {
      let file = event.currentTarget.files[0];
      let videoNode = this.$('video')[0];
      videoNode.src = URL.createObjectURL(file);
    }
  }
});
