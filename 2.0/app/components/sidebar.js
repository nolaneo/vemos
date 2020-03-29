import Component from "@glimmer/component";
import { action } from "@ember/object";

export default class SidebarComponent extends Component {
  @action testMethod() {
    console.log("hello world");
  }
}
