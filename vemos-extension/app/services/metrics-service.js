import Service, { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";

export default class MetricsService extends Service {
  @service parentDomService;
  vemosMetricsFrame = undefined;
  queuedMetrics = [];
  @tracked version;

  initialize(frame) {
    this.vemosMetricsFrame = frame;
    this.queuedMetrics.forEach((metric) => this.recordMetric(metric));
    this.version = document
      .querySelector("#vemos-version-number")
      ?.getAttribute("content");
  }

  recordMetric(metricName, data = {}, version) {
    if (this.vemosMetricsFrame) {
      try {
        console.log("Event: ", metricName);
        this.vemosMetricsFrame.contentWindow.postMessage(
          {
            vemos_event: metricName,
            metadata: {
              ...data,
              vemos_version: this.version,
              host: this.parentDomService.host,
            },
          },
          "*"
        );
      } catch (error) {
        console.log("Skipping metrics for ", metricName);
      }
    } else {
      queuedMetrics.push(metricName);
    }
  }
}
