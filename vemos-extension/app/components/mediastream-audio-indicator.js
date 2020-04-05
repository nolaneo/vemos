import Component from "@glimmer/component";
import { action } from "@ember/object";
import { isNone } from "@ember/utils";
import { throttle } from "@ember/runloop";
import { tracked } from "@glimmer/tracking";
import { htmlSafe } from "@ember/string";

export default class MediastreamAudioIndicatorComponent extends Component {
  @tracked audioLevel = 0;
  largest;

  audioContext = undefined;
  analyser = undefined;
  audioSource = undefined;
  processor = undefined;

  get style() {
    return new htmlSafe(`
      --height: ${Number(this.audioLevel)}%;
    `);
  }

  @action setupAnalyser() {
    if (isNone(this.args.mediaStream)) {
      return;
    }

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.audioSource = this.audioContext.createMediaStreamSource(
      this.args.mediaStream
    );
    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

    this.analyser.smoothingTimeConstant = 0.3;
    this.analyser.fftSize = 1024;

    this.audioSource.connect(this.analyser);
    this.analyser.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    this.processor.onaudioprocess = this.processAudioLevel.bind(this);
  }

  processAudioLevel() {
    let data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let values = data.reduce((a, b) => a + b, 0);
    let audioValue = (values / data.length) * 1.5;
    if (audioValue > this.largestAudioValue) {
      this.largestAudioValue = audioValue;
    }

    throttle(this, this.throttledAudioProcess, 100);
  }

  throttledAudioProcess() {
    this.audioLevel = this.largestAudioValue;
    this.largestAudioValue = 0;
  }
}
