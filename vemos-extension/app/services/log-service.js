import Service from "@ember/service";
import { tracked } from "@glimmer/tracking";
import { A } from "@ember/array";

export default class LogService extends Service {
  @tracked logs = A();

  log(text) {
    console.log(`VEMOS: `, text);
    this.insert(text, "log");
  }

  error(error) {
    console.error(`VEMOS:`, error);
    this.insert(error, "error");
  }

  insert(log, level) {
    this.logs.insertAt(0, {
      time: new Date(),
      text: log,
      level: level,
    });
    if (this.logs.length > 1000) {
      this.logs.popObject();
    }
  }
}
