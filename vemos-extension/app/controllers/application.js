import Controller from "@ember/controller";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";

export default class ApplicationController extends Controller {
  @service metricsService;

  @action setupMetricsService(frame) {
    this.metricsService.initialize(frame);
  }
}
