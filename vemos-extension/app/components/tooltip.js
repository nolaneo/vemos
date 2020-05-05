import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { action } from "@ember/object";
import { htmlSafe } from "@ember/string";
import { tracked } from "@glimmer/tracking";
import { scheduleOnce } from "@ember/runloop";

export default class TooltipComponent extends Component {
  @service parentDomService;

  @tracked container = undefined;
  @tracked tooltip = undefined;
  @tracked isVisible = false;

  get style() {
    if (this.container && this.tooltip) {
      let rect = this.container.getBoundingClientRect();
      let parentRect = this.parentDomService.container.getBoundingClientRect();
      let tooltipRect = this.tooltip.getBoundingClientRect();

      let absoluteRect = new DOMRect(
        rect.x + parentRect.x,
        rect.y + parentRect.y,
        rect.width,
        rect.height
      );

      // Center the tooltip if there's room, otherwise 4px from the right of the window.
      let left = Math.min(
        absoluteRect.left - tooltipRect.width / 2 + rect.width / 2,
        parentRect.right - 4 - tooltipRect.width
      );

      return htmlSafe(`
        top: ${absoluteRect.y - (tooltipRect.height + 10)}px;
        left: ${left}px;
        width: ${tooltipRect.width}px;
        height: ${tooltipRect.height}px;
        opacity: ${this.isVisible ? 1 : 0};
      `);
    } else {
      return htmlSafe("");
    }
  }

  @action setupHandlers(element) {
    this.container = element.parentElement;
    this.container.addEventListener("mouseenter", this.onMouseEnter.bind(this));
    this.container.addEventListener("mouseleave", this.onMouseLeave.bind(this));
  }

  @action setElement(element) {
    this.tooltip = element;
  }

  @action destroy() {
    this.container.removeEventListener(
      "mouseenter",
      this.onMouseEnter.bind(this)
    );
    this.container.removeEventListener(
      "mouseleave",
      this.onMouseLeave.bind(this)
    );
  }

  @action onMouseEnter() {
    this.isVisible = true;
  }

  @action onMouseLeave() {
    this.isVisible = false;
  }
}
