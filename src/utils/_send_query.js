function _send_query(url, success, error){
  if ((_type(XMLHttpRequest)==='Object'||_type(XMLHttpRequest)==='Function') && 'withCredentials' in new XMLHttpRequest()) {
    _request.xhr.call(this, "GET", url, null, null, this.client.readKey, success, error);
  } else {
    _request.jsonp.call(this, url, this.client.readKey, success, error);
  }
}
