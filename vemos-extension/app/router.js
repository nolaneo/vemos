import EmberRouter from '@ember/routing/router';
import config from './config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  this.route('vemos', function() {
    this.route('start');
    this.route('main', function() {
      this.route('invite');
      this.route('join');
      this.route('connected');
    });
  });
});
