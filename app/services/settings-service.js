import Service from '@ember/service';

export default Service.extend({
  initialize() {
    let webcamBrightness = localStorage.getItem('webcamBrightness');
    if (webcamBrightness) {
      this.set('webcamBrightness', parseInt(webcamBrightness));
    } else {
      this.set('webcamBrightness', 2);
    }
  },

  brighten() {
    let brightness = this.get('webcamBrightness');
    this.set('webcamBrightness', Math.min(5, brightness + 1));
    this.updateLocalStorageBrightness();
  },

  darken() {
    let brightness = this.get('webcamBrightness');
    this.set('webcamBrightness', Math.max(1, brightness - 1));
    this.updateLocalStorageBrightness()
  },

  updateLocalStorageBrightness() {
    let brightness = this.get('webcamBrightness');
    localStorage.setItem('webcamBrightness', brightness);
  },

  webcamIsMainView: false,
});
