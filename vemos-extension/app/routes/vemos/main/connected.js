import Route from "@ember/routing/route";
import { inject as service } from "@ember/service";

export default class VemosMainConnectedRoute extends Route {
  @service videoCallService;
}
