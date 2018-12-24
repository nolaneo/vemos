import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  classNames: ['quick-chat'],
  connectionService: service(),

  didInsertElement() {
    this.get('connectionService').on('received', (data) => this.handleMessage(data));
  },

  handleMessage(data) {
    console.log('received data', data);
    if (data.chatMessage) {
      this.get('showMessage').perform(data.chatMessage);
    }
  },

  showMessage: task(function * (message) {
    this.$('.from-remote').addClass('visible');
    this.$('.from-remote').text(message);
    yield timeout(2500);
    this.$('.from-remote').removeClass('visible');
  }).restartable(),

  actions: {
    submitChat(value) {
      this.$('input').val('');
      this.get('connectionService.connection').send({
        chatMessage: value,
      });
    },
  }
});
