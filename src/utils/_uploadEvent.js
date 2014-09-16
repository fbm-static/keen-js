// Private for Keen IO Tracker JS
// -------------------------------
function _uploadEvent(eventCollection, payload, success, error) {
  var url = _build_url.apply(this, ['/events/' + eventCollection]);
  var newEvent = {};

  // Add properties from client.globalProperties
  if (this.client.globalProperties) {
    newEvent = this.client.globalProperties(eventCollection);
  }

  // Add properties from user-defined event
  for (var property in payload) {
    if (payload.hasOwnProperty(property)) {
      newEvent[property] = payload[property];
    }
  }

  // Send data
  switch(this.client.requestType){

    case 'xhr':
      _request.xhr.apply(this, ["POST", url, null, newEvent, this.client.writeKey, success, error]);
      break;

    case 'jsonp':
      var jsonBody = JSON.stringify(newEvent);
      var base64Body = Keen.Base64.encode(jsonBody);
      url = url + "?api_key=" + this.client.writeKey;
      url = url + "&data=" + encodeURIComponent(base64Body);
      url = url + "&modified=" + new Date().getTime();
      _request.jsonp.apply(this, [url, this.client.writeKey, success, error])
      break;

    case 'beacon':
      var jsonBody = JSON.stringify(newEvent);
      var base64Body = Keen.Base64.encode(jsonBody);
      url = url + "?api_key=" + encodeURIComponent(this.client.writeKey);
      url = url + "&data=" + encodeURIComponent(base64Body);
      url = url + "&modified=" + encodeURIComponent(new Date().getTime());
      url = url + "&c=clv1";
      _request.beacon.apply(this, [url, null, success, error]);
      break;

  }
}