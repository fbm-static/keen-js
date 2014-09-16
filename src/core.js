  /*!
  * ----------------
  * Keen IO Core JS
  * ----------------
  */

  function Keen(config) {
    return _init.apply(this, arguments);
  }

  Keen.prototype.configure = function(config){

    config['host'] = (_isUndefined(config['host'])) ? 'api.keen.io/3.0' : config['host'].replace(/.*?:\/\//g, '');
    config['protocol'] = _set_protocol(config['protocol']);
    config['requestType'] = _set_request_type(config['requestType']);

    this.client = {
      projectId: config.projectId,
      writeKey: config.writeKey,
      readKey: config.readKey,
      globalProperties: null,

      endpoint: config['protocol'] + "://" + config['host'],
      requestType: config['requestType']
    };

    Keen.trigger('client', this, config);
    this.trigger('ready');

    return this;
  };

  var _request = {

    xhr: function(method, url, headers, body, apiKey, success, error){
      if (!apiKey) return Keen.log('Please provide a writeKey for https://keen.io/project/' + this.client.projectId);
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            var response;
            try {
              response = JSON.parse(xhr.responseText);
            } catch (e) {
              Keen.log("Could not JSON parse HTTP response: " + xhr.responseText);
              if (error) error(xhr, e);
            }
            if (success && response) success(response);
          } else {
            Keen.log("HTTP request failed.");
            if (error) error(xhr, null);
          }
        }
      };
      xhr.open(method, url, true);
      if (apiKey) xhr.setRequestHeader("Authorization", apiKey);
      if (body) xhr.setRequestHeader("Content-Type", "application/json");
      if (headers) {
        for (var headerName in headers) {
          if (headers.hasOwnProperty(headerName)) xhr.setRequestHeader(headerName, headers[headerName]);
        }
      }
      var toSend = body ? JSON.stringify(body) : null;
      xhr.send(toSend);
    },

    jsonp: function(url, apiKey, success, error){
      if (!apiKey) return Keen.log('Please provide a writeKey for https://keen.io/project/' + this.client.projectId);
      if (apiKey && url.indexOf("api_key") < 0) {
        var delimiterChar = url.indexOf("?") > 0 ? "&" : "?";
        url = url + delimiterChar + "api_key=" + apiKey;
      }

      var callbackName = "keenJSONPCallback" + new Date().getTime();
      while (callbackName in window) {
        callbackName += "a";
      }
      var loaded = false;
      window[callbackName] = function (response) {
        loaded = true;
        if (success && response) {
          success(response);
        };
        // Remove this from the namespace
        window[callbackName] = undefined;
      };
      url = url + "&jsonp=" + callbackName;
      var script = document.createElement("script");
      script.id = "keen-jsonp";
      script.src = url;
      document.getElementsByTagName("head")[0].appendChild(script);
      // for early IE w/ no onerror event
      script.onreadystatechange = function() {
        if (loaded === false && this.readyState === "loaded") {
          loaded = true;
          if (error) error();
        }
      }
      // non-ie, etc
      script.onerror = function() {
        if (loaded === false) { // on IE9 both onerror and onreadystatechange are called
          loaded = true;
          if (error) error();
        }
      }
    },

    beacon: function(url, apiKey, success, error){
      if (apiKey && url.indexOf("api_key") < 0) {
        var delimiterChar = url.indexOf("?") > 0 ? "&" : "?";
        url = url + delimiterChar + "api_key=" + apiKey;
      }
      var loaded = false, img = document.createElement("img");
      img.onload = function() {
        loaded = true;
        if ('naturalHeight' in this) {
          if (this.naturalHeight + this.naturalWidth === 0) {
            this.onerror(); return;
          }
        } else if (this.width + this.height === 0) {
          this.onerror(); return;
        }
        if (success) success({created: true});
      };
      img.onerror = function() {
        loaded = true;
        if (error) error();
      };
      img.src = url;
    }
  };


  // -------------------------------
  // Keen.Events
  // We <3 BackboneJS!
  // -------------------------------

  var Events = Keen.Events = {
    on: function(name, callback) {
      this.listeners || (this.listeners = {});
      var events = this.listeners[name] || (this.listeners[name] = []);
      events.push({callback: callback});
      return this;
    },
    once: function(name, callback, context) {
      var self = this;
      var once = _once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return self.on(name, once, context);
    },
    off: function(name, callback, context) {
      if (!this.listeners) return this;

      // Remove all callbacks for all events.
      if (!name && !callback && !context) {
        this.listeners = void 0;
        return this;
      }

      var names = [];
      if (name) {
        names.push(name);
      } else {
        _each(this.listeners, function(value, key){
          names.push(key);
        });
      }

      for (var i = 0, length = names.length; i < length; i++) {
        name = names[i];

        // Bail out if there are no events stored.
        var events = this.listeners[name];
        if (!events) continue;

        // Remove all callbacks for this event.
        if (!callback && !context) {
          delete this.listeners[name];
          continue;
        }

        // Find any remaining events.
        var remaining = [];
        for (var j = 0, k = events.length; j < k; j++) {
          var event = events[j];
          if (
            callback && callback !== event.callback &&
            callback !== event.callback._callback ||
            context && context !== event.context
          ) {
            remaining.push(event);
          }
        }

        // Replace events if there are any remaining.  Otherwise, clean up.
        if (remaining.length) {
          this.listeners[name] = remaining;
        } else {
          delete this.listeners[name];
        }
      }

      return this;
    },
    trigger: function(name) {
      if (!this.listeners) return this;
      var args = Array.prototype.slice.call(arguments, 1);
      var events = this.listeners[name] || [];
      for (var i = 0; i < events.length; i++) {
        events[i]['callback'].apply(this, args);
      }
      return this;
    }
  };
  _extend(Keen.prototype, Events);
  _extend(Keen, Events);

  Keen.loaded = true;

  // Expose utils
  Keen.utils = {
    each: _each,
    extend: _extend,
    parseParams: _parse_params
  };

  Keen.ready = function(callback){
    if (Keen.loaded) {
      callback();
    } else {
      Keen.on('ready', callback);
    }
  };

  Keen.log = function(message) {
    if (typeof console == "object") {
      console.log('[Keen IO]', message);
    }
  };

  // -------------------------------
  // Keen.Plugins
  // -------------------------------

  var Plugins = Keen.Plugins = {};
