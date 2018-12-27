import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  connectionService: service(),
  settingsService: service(),
  beforeModel() {
    this.get('settingsService').initialize();
    if (this.get('connectionService.isNotConnected')) {
      this.transitionTo('connections.waiting');
    }
  }

});
