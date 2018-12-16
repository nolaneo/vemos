import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  connectionService: service(),
  beforeModel() {
    if (this.get('connectionService.isNotConnected')) {
      // this.transitionTo('connections.waiting');
    }
  }

});
