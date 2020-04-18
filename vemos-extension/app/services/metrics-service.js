import Service, { inject as service } from "@ember/service";

export default class MetricsService extends Service {
  @service parentDomService;
  vemosMetricsFrame = undefined;
  queuedMetrics = [];

  initialize(frame) {
    this.vemosMetricsFrame = frame;
    this.queuedMetrics.forEach((metric) => this.recordMetric(metric));
  }

  recordMetric(metricName) {
    if (this.vemosMetricsFrame) {
      try {
        console.log("Event: ", metricName);
        this.vemosMetricsFrame.contentWindow.postMessage({
          vemos_event: metricName,
          metadata: {
            host: this.parentDomService.host,
          },
        });
      } catch (error) {
        console.log("Skipping metrics for ", metricName);
      }
    } else {
      queuedMetrics.push(metricName);
    }
  }
}
