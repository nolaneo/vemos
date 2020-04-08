import Service, { inject as service } from "@ember/service";

const CONTAINER_ID = `vemos-container`;

export default class ParentDomService extends Service {
  @service peerService;
  container = undefined;
  window = undefined;
  
  initialize() {
    console.log(`Initializing Parent DOM Service`);
    this.window = window.parent;
    this.container = window.parent.document.getElementById(CONTAINER_ID);
  }
}
