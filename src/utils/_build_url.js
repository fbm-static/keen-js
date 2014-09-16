function _build_url(path) {
  return this.client.endpoint + '/projects/' + this.client.projectId + path;
}
