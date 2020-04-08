import Component from '@glimmer/component';
import { inject as service } from '@ember/service';

export default class ParentDomFrameComponent extends Component {
  @service parentDomService;
}
