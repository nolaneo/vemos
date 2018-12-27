import Component from '@ember/component';
import { inject as service } from '@ember/service'

export default Component.extend({
  classNames: ['settings__container', 'layout__box', 'o__has-columns'],
  settingsService: service(),

  actions: {
    swapVideos() {
      this.toggleProperty('settingsService.webcamIsMainView')
    },
    brighten() {
      this.get('settingsService').brighten();
    },
    darken() {
      this.get('settingsService').darken();
    }
  }
});
