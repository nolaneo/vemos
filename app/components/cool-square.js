import Component from '@ember/component';
import { computed } from '@ember/object';
import { schedule } from '@ember/runloop';

export default Component.extend({
  didInsertElement() {
    this._super(...arguments);
    schedule('afterRender', this, this.setup);
  },

  classNames: [
    'coolsquare'
  ],

  setup() {
    this.$().css({
      'position': 'fixed',
      'left': `calc(50% - ${(this.get('size') / 2) + this.get('jitter')}px)`,
      'top': `calc(50% - ${(this.get('size') / 2) + this.get('jitter')}px)`,
      'opacity': 0.7,
      'z-index': 0 || (this.get('index') + 1),
      'width': this.get('size'),
      'height': this.get('size'),
      'border-top-left-radius': `${this.randomInRange(1, 5) * 10}%`,
      'border-top-right-radius': `${this.randomInRange(1, 5) * 10}%`,
      'border-bottom-left-radius': `${this.randomInRange(1, 5) * 10}%`,
      'border-bottom-right-radius': `${this.randomInRange(1, 5) * 10}%`,
      'animation': `spin ${this.randomInRange(3, 15)}s linear infinite`,
      'background': `linear-gradient(${this.get('color').from}, ${this.get('color').to})`
    });
  },

  jitter: computed('size', function() {
    let size = this.get('size');
    let jitter = size / this.randomInRange(2, 4);
    jitter = Math.random() < 0.5 ? jitter : -jitter;
    return jitter;
  }),

  size: computed(function() {
    return this.randomInRange(window.innerWidth * 0.33, window.innerWidth * 0.75);
  }),

  randomInRange(minimum, maximum) {
    let min = Math.ceil(minimum);
    let max = Math.floor(maximum);
    return Math.floor(Math.random() * (max - min)) + min
  }
});
