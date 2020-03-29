import Service from "@ember/service";

const CONTAINER_ID = `vemos-container`;

export default class ParentDomServiceService extends Service {
  container = undefined;
  window = undefined;

  initialize() {
    console.log(`Initializing Parent DOM Service`);
    this.window = window.parent;
    this.container = window.parent.document.getElementById(CONTAINER_ID);
  }
}
