export function initialize(applicationInstance) {
  let peerService = applicationInstance.lookup("service:peer-service");
  peerService.initialize();
}
