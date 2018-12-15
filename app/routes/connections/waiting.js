import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  connectionService: service(),
  activate() {
    this.get('connectionService').on('connected', () => this.transitionTo('connections.connected'));
    this.transitionTo('connections.waiting')
  }
});
