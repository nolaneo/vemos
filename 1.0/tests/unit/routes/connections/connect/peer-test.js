import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | connections/connect/peer', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:connections/connect/peer');
    assert.ok(route);
  });
});
