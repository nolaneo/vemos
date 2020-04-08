import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class NoticeHeadphonesComponent extends Component {
  @action closeModal() {
    this.args.onClose();
  }
}
