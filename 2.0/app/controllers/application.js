import Controller from "@ember/controller";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";

export default class ApplicationController extends Controller {
  @service parentDomService;

  @action initializeParentDomService() {
    this.parentDomService.initialize();
  }

  @action testMethod() {
    console.log("hello world");
  }
}
