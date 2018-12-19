import Controller from '@ember/controller';

export default Controller.extend({
  webcamIsMainView: false,
  actions: {
    swapView() {
      this.toggleProperty('webcamIsMainView');
    }
  }
});
