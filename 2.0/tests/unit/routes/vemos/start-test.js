import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | vemos/start', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:vemos/start');
    assert.ok(route);
  });
});
