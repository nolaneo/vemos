import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import ENV from 'vemos/config/environment';

const COLORS = [
  { from: '#fa3152', to: '#c82742' },
  { from: '#b71a92', to: '#921575' },
  { from: '#007ec9', to: '#0065a1' },
  { from: '#00b087', to: '#008d6b' },
  { from: '#dfe300', to: '#b1b600' }
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
  fullsize: window.innerWidth * 1.5,

  actions: {
    copied() {
      this.set('copied', true);
    }
  }
});
