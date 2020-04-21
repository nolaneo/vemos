import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { schedule } from "@ember/runloop";
export default class ParentDomFrameComponent extends Component {
  @service parentDomService;
  @tracked iframeDocument = undefined;

  @action setIframe(iframe) {
    schedule("afterRender", this, () => {
      let styles = document.getElementById("vemos-styles").cloneNode();
      styles.onload = () => {
        console.log("ONLOAD");
        this.iframeDocument = iframe.contentDocument.body;
      };
      iframe.contentDocument.head.appendChild(styles);
    });
  }
}
