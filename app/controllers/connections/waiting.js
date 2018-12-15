import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import ENV from 'vemos/config/environment';

const COLORS = [
  { from: '#fa3152', to: '#ff2c91' },
  { from: '#b71a92', to: '#b60cc6' },
  { from: '#007ec9', to: '#00beca' },
  { from: '#00b087', to: '#00b050' },
  { from: '#dfe300', to: '#e39e00' }
];

//Taken from https://gomakethings.com/how-to-shuffle-an-array-with-vanilla-js/
const shuffle = function (array) {
	var currentIndex = array.length;
	var temporaryValue, randomIndex;

	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
};

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
  fullsize: Math.max(window.innerWidth, window.innerWidth) * 1.5,

  actions: {
    copied() {
      this.set('copied', true);
    }
  }
});
