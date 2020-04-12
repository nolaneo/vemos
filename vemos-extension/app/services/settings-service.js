import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class SettingsServiceService extends Service {
  @tracked isMinimized = false;

  @action toggleMinimized() {
    this.isMinimized = !this.isMinimized;
  }
}
