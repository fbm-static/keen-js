function _set_request_type(value) {
  var configured = value || 'jsonp';
  var capableXHR = false;
  //if ((typeof XMLHttpRequest === 'object' || typeof XMLHttpRequest === 'function') && 'withCredentials' in new XMLHttpRequest()) {
  if ((_type(XMLHttpRequest)==='Object'||_type(XMLHttpRequest)==='Function') && 'withCredentials' in new XMLHttpRequest()) {
    capableXHR = true;
  }
  //var capableXHR = (void 0 !== XMLHttpRequest && 'withCredentials' in new XMLHttpRequest());

  if (configured == null || configured == 'xhr') {
    if (capableXHR) {
      return 'xhr';
    } else {
      return 'jsonp';
    }
  } else {
    return configured;
  }
}
