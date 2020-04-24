import Component from '@ember/component';
import { inject as service } from "@ember/service";

export default class DragHandleComponent extends Component {
    @service parentDomService;

    isActive = false;
    initialX = 0;

    mouseDown(event) {
        this.set('isActive', true);
        this.initialX = event.clientX;
    }

    mouseMove(event) {
        if (this.isActive)
        {

            var newBodyWidth = event.screenX - this.initialX;
            var newVemosWidth = this.parentDomService.window.innerWidth - newBodyWidth;
            
            this.parentDomService.window.document.body.style.width = newBodyWidth + "px";
            this.parentDomService.container.style.width = newVemosWidth + "px";
        }
    }

    mouseUp() {
        if (!this.isActive) {
            return;
        }

        this.set('isActive', false);
    }
}