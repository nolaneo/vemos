import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import ENV from 'vemos/config/environment';
import COLORS from 'vemos/lib/colors';
import shuffle from 'vemos/lib/shuffle';

export default Controller.extend({
  connectionService: service(),
  router: service(),
  url: computed('connectionService.peerId', function() {
    if (this.get('connectionService.peerId')) {
      let path = this.get('router').urlFor('connections.connect.peer', { id: this.get('connectionService.peerId') });
      let { protocol, host } = window.location;
      return `${protocol}//${host}${ENV.rootURL}${path}`;
    }
  }),
  colors: computed(function() {
    let colors = shuffle(COLORS);
    return {
      background: colors.pop(),
      squares: colors
    }
  }),
  fullsize: Math.max(window.innerWidth, window.innerWidth) * 2,

  actions: {
    copied() {
      this.set('copied', true);
    }
  }
});
