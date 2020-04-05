export function initialize(applicationInstance) {
  let parentDomService = applicationInstance.lookup("service:parentDomService");
  parentDomService.initialize();
}
