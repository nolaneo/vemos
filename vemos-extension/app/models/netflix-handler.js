import VideoHandler from './video-handler';
import { timeout } from "ember-concurrency";

export default class NetflixHandler extends VideoHandler {
  netflixAPI = undefined;
  netflixPlayer = undefined;

  constructor(peerService, parentDomService) {
    super(peerService, parentDomService);
    this.handlerName = "Netflix";
  }

  async performSeek(time) {
    console.log("[Netflix] Perform Seek");
    this.parentDomService.window.postMessage({ vemosSeekTime: time }, "*");
    return await timeout(50);
  }
}