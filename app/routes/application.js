import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  connectionService: service(),

  beforeModel(transition) {
    this.get('connectionService').initialize();
    if (transition.intent.url == "/") {
      this.transitionTo('connections.waiting');
    }
  }
});
