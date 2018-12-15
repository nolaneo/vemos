import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('connections', function() {
    this.route('connected');

    this.route('connect', function() {
      this.route('peer', { path: ':id' });
    });
    this.route('waiting');
  });
});

export default Router;
