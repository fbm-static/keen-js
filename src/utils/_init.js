function _init(config) {
  if (_isUndefined(config)) {
    throw new Error("Check out our JavaScript SDK Usage Guide: https://keen.io/docs/clients/javascript/usage-guide/");
  }
  if (_isUndefined(config.projectId) || _type(config.projectId) !== 'String' || config.projectId.length < 1) {
    throw new Error("Please provide a projectId");
  }

  this.configure(config);
}
