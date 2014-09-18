/*!
* ----------------------
* Keen IO Visualization
* ----------------------
*/

Keen.prototype.draw = function(query, el, config) {
  // Find DOM element, set height, build spinner
  var config = config || {};
  var el = el;
  var spinner = new Keen.Spinner(Keen.Spinner.defaults).spin(el);

  var request = new Keen.Request(this, [query]);

  request.on("complete", function(){
    if (spinner) {
      spinner.stop();
    }
    this.draw(el, config);
  });

  request.on("error", function(response){
    spinner.stop();

    var errorConfig = Keen.utils.extend({
      error: response,
      el: el
    }, Keen.Visualization.defaults);
    new Keen.Visualization.libraries['keen-io']['error'](errorConfig);
  });

  return request;
};


// -------------------------------
// Inject Request Draw Method
// -------------------------------
Keen.Request.prototype.draw = function(selector, config) {
  _build_visual.call(this, selector, config);
  this.on('complete', function(){
    _build_visual.call(this, selector, config);
  });
  return this;
};

// -------------------------------
// Keen.Visualization
// -------------------------------
Keen.Visualization = function(dataset, el, config){
  var chartType = (config && config.chartType) ? config.chartType : null;
  return new Keen.Dataviz(chartType)
                 .prepare(el)
                 .data(dataset, config)
                 .config(config)
                 .render(el);
};

// *******************
// START NEW CLEAN API
// *******************

Keen.Dataviz = function() {
  this.config = {};
  this.dataformSchema = {
    collection: 'result',
    select: true
  };

  this.dataset = { 
    parse: function(){ console.log("demo"); },
    table: [["date", "value"],[new Date().toISOString(), 54343]]
  }; // => new Dataset()
  
  this.view = {};
  return this._prepare();
};

_extend(Keen.Dataviz.prototype, Events);
Keen.Dataviz.prototype.chartType = function(type) {
  if(type) { this.config}
};

Keen.Dataviz.prototype.data = function(dataset, config) {
  var self = this;

  if (!dataset) {
    throw new Error('You must pass data to the data() function.');
  }
  this.dataset = dataset;

  if (this.dataset instanceof Keen.Request) {
    this.data = (this.dataset.data instanceof Array) ? this.dataset.data[0] : this.dataset.data;
  } else {
    // Handle raw data
    // _transform() and handle as usual
    this.data = (this.dataset instanceof Array) ? this.dataset[0] : this.dataset;
  }

  if(!config.chartType) {
    // Set the capable chart types and default type for this viz.
    this.setCapabilities(config);
  }

  return this._configure()
             ._dataform()
             ._setSpecificChartOptions()
             .run(function() {
               this.config.data = (this.data) ? _transform.call(this.config, this.data, this.dataformSchema) : [];
             }.bind(this))
             ._applyColorMapping();
};

Keen.Dataviz.prototype._configure = function(config) {
  // Backwoods cloning facility
  var defaults = JSON.parse(JSON.stringify(Keen.Visualization.defaults));
  this.config = _extend(defaults, config);

  // Build default title if necessary to do so.
  return !this.config.title && this.dataset instanceof Keen.Request ? 
            this._buildDefaultTitle() : this;
};

Keen.Dataviz.prototype._prepare = function(el) {
  this.config.el = el;
  this.config.el.innerHTML = "";
  var placeholder = document.createElement("div");
  placeholder.className = "keen-loading";
  //placeholder.style.background = "#f2f2f2";
  placeholder.style.height = (this.config.height || Keen.Visualization.defaults.height) + "px";
  placeholder.style.position = "relative";
  placeholder.style.width = (this.config.width || Keen.Visualization.defaults.width) + "px";
  el.innerHTML = "";
  el.appendChild(placeholder);
  this.spinner = new Keen.Spinner(Keen.Spinner.defaults).spin(placeholder);
  return this;
};

Keen.Dataviz.prototype._buildDefaultTitle = function() {
  var self = this;
  this.config.title = (function(){
    var analysis = self.dataset.queries[0].analysis.replace("_", " "),
        collection = self.dataset.queries[0].get('event_collection'),
        output;

    output = analysis.replace( /\b./g, function(a){
      return a.toUpperCase();
    });

    if (collection) {
      output += ' - ' + collection;
    }
    return output;
  })();
  return this;
};

Keen.Dataviz.prototype.setCapabilities = function(config) {
  var self = this,
      capabilityMatrix = Keen.Visualization.libraries[config.library]['_capabilities'],
      formatMatrix;

  // Set the visualization types this reqest can do.
  if (this.dataset instanceof Keen.Request) {
    // Handle known scenarios
    this.isMetric = (typeof this.dataset.data.result === "number" || this.dataset.data.result === null) ? true : false,
    this.isFunnel = (this.dataset.queries[0].get('steps')) ? true : false,
    this.isInterval = (this.dataset.queries[0].get('interval')) ? true : false,
    this.isGroupBy = (this.dataset.queries[0].get('group_by')) ? true : false,
    this.is2xGroupBy = (this.dataset.queries[0].get('group_by') instanceof Array) ? true : false;
    this.isExtraction = (this.dataset.queries[0].analysis == 'extraction') ? true : false;
  } else {
    this.isMetric = (typeof this.dataset.result === "number" || this.dataset.result === null) ? true : false;
  }

  formatMatrix = {
    'single': this.isMetric, 
    'categorical': !this.isInterval && this.isGroupBy,
    'chronological': this.isInterval && !this.isGroupBy,
    'cat-chronological': this.isInterval && this.isGroupBy,
    'cat-ordinal' : this.isFunnel,
    'cat-interval' : this.is2xGroupBy,
    'extraction' : this.isExtraction
  };

  this.capabilities = [] || Keen.Visualization.libraries[config.library]['_capabilities'];
  _each(formatMatrix, function(format, name) {
    if(format) {
      self.capabilities = capabilityMatrix[name];
    }
  });

  return this;

};

Keen.Dataviz.prototype.setDataformSchema = function() {
  if (this.is2xGroupBy) {
    this.dataformSchema = {
      collection: 'result',
      sort: {
        index: 'asc',
        label: 'desc'
      }
    };
    if (this.isInterval) {
      this.dataformSchema.unpack = {
        index: 'timeframe -> start',
        label: 'value -> ' + this.dataset.queries[0].params.group_by[0],
        value: 'value -> result'
      };
    } else {
      this.dataformSchema.unpack = {
        index: this.dataset.queries[0].params.group_by[0],
        label: this.dataset.queries[0].params.group_by[1],
        value: 'result'
      };
    }
  }

  if (this.isExtraction) {
    this.dataformSchema = {
      collection: "result",
      select: true
    };
    if (this.dataset.queries[0].get('property_names')) {
      this.dataformSchema.select = [];
      for (var i = 0; i < this.dataset.queries[0].get('property_names').length; i++) {
        this.dataformSchema.select.push({ path: this.dataset.queries[0].get('property_names')[i] });
      }
    }
  }
  return this;
};

Keen.Dataviz.prototype.applyColorMapping = function() {
  // Apply color-mapping options (post-process)
  // -------------------------------
  var self = this;

  if (this.config.colorMapping) {

    // Map to selected index
    if (this.config.data.schema.select && this.config.data.table[0].length == 2) {
      _each(this.config.data.table, function(row, i){
        if (i > 0 && self.config.colorMapping[row[0]]) {
          self.config.colors.splice(i-1, 0, self.config.colorMapping[row[0]]);
        }
      });
    }

    // Map to unpacked labels
    if (this.config.data.schema.unpack) { //  && this.config['data'].table[0].length > 2
      _each(this.config.data.table[0], function(cell, i){
        if (i > 0 && self.config.colorMapping[cell]) {
          self.config.colors.splice(i-1, 0, self.config.colorMapping[cell]);
        }
      });
    }

  }
  return this;
};

Keen.Dataviz.prototype.setSpecificChartOptions = function() {
  // A few last details
  // -------------------------------

  if (this.config.chartType == 'metric') {
    this.config.library = 'keen-io';
  }

  if (this.config.chartOptions.lineWidth == void 0) {
    this.config.chartOptions.lineWidth = 2;
  }

  if (this.config.chartType == 'piechart') {
    if (this.config.chartOptions.sliceVisibilityThreshold == void 0) {
      this.config.chartOptions.sliceVisibilityThreshold = 0.01;
    }
  }

  if (this.config.chartType == 'columnchart' || this.config.chartType == 'areachart' || this.config.chartType == 'linechart') {

    if (this.config.chartOptions.hAxis == void 0) {
      this.config.chartOptions.hAxis = {
        baselineColor: 'transparent',
        gridlines: { color: 'transparent' }
      };
    }

    if (this.config.chartOptions.vAxis == void 0) {
      this.config.chartOptions.vAxis = {
        viewWindow: { min: 0 }
      };
    }
  }
  return this;
};

Keen.Dataviz.prototype.render = function(el) {
  // Set chart type to default if one hasn't seen set,
  // which is just the first index in the array of chart types this viz is capable of.
  if (!this.config.chartType) {
    this.config.chartType = this.capabilities[0];
  }
  if (this.spinner) {
    this.spinner.stop();
  }
  this.config.el = el;

  if (this.config.library) {
    if (Keen.Visualization.libraries[this.config.library][this.config.chartType]) {
      this.chart = new Keen.Visualization.libraries[this.config.library][this.config.chartType](this.config);
    } else {
      throw new Error('The library you selected does not support this metric');
    }
  } else {
    throw new Error('The library you selected is not present');
  }

  return this;
};

Keen.Dataviz.prototype.remove = function() {
  if (this.config.el) {
    this.config.el.innerHTML = "";
  }
  if (this.spinner) {
    this.spinner.stop();
    this.spinner = null;
  }
  if (this.viz) {
    this.viz = null; // TODO: Destroy the actual chart object?
  }
};

var baseVisualization = function(config){
  var self = this;
  _extend(self, config);

  // Set default event handlers
  self.on("error", function(){
    var errorConfig, error;
    errorConfig = Keen.utils.extend({
      error: { message: arguments[0] }
    }, config);
    error = new Keen.Visualization.libraries['keen-io']['error'](errorConfig);
  });
  self.on("update", function(){
    self.update.apply(this, arguments);
  });
  self.on("remove", function(){
    self.remove.apply(this, arguments);
  });

  // Let's kick it off!
  self.initialize();
  Keen.Visualization.visuals.push(self);
};

baseVisualization.prototype = {
  initialize: function(){
    // Set listeners and prepare data
  },
  render: function(){
    // Build artifacts
  },
  update: function(){
    // Handle data updates
  },
  remove: function(){
    // Handle deletion
  }
};
_extend(baseVisualization.prototype, Events);

Keen.Visualization.find = function(target){
  var el, match;
  if (target) {
    el = target.nodeName ? target : document.querySelector(target);
    _each(Keen.Visualization.visuals, function(visual){
      if (el == visual.el){
        match = visual;
        return false;
      }
    });
    if (match) {
      return match;
    }
    throw("Visualization not found");
  } else {
    return Keen.Visualization.visuals;
  }
};

Keen.Visualization.register = function(name, methods, config){
  Keen.Visualization.libraries[name] = Keen.Visualization.libraries[name] || {};
  var lib = Keen.Visualization.libraries[name] || {};
  for (var method in methods) {
    lib[method] = methods[method];
  }
  if(config && config.capabilities) {
    lib._capabilities = config.capabilities;
  }
  var loadHandler = function(st) {
    st.loaded++;
    if(st.loaded === st.loading) {
      Keen.loaded = true;
      Keen.trigger('ready');
    }
  };

  var self = this;

  // For all dependencies
  if(config && config.dependencies) {
    _each(config.dependencies, function (dependency, index, collection) {
      var status = Keen.Visualization.dependencies;
      // If it doesn't exist in the current dependencies being loaded
      if(!status.urls[dependency.url]) {
        status.urls[dependency.url] = true;
        status.loading++;
        var method = dependency.type === 'script' ? _load_script : _load_style;

        method(dependency.url, function() {
          if(dependency.cb) {
            dependency.cb.call(self, function() {
              loadHandler(status);
            });
          } else {
            loadHandler(status);
          }
        });
      }
    }); // End each
  }
};

Keen.Visualization.extend = function(protoProps, staticProps){
  var Visualization,
      parent = baseVisualization;

  if (protoProps && protoProps.hasOwnProperty('constructor')) {
    Visualization = protoProps.constructor;
  } else {
    Visualization = function(){ return parent.apply(this, arguments); };
  }

  _extend(Visualization, parent, staticProps);
  var Surrogate = function(){ this.constructor = Visualization; };
  Surrogate.prototype = parent.prototype;
  Visualization.prototype = new Surrogate();
  if (protoProps) {
    _extend(Visualization.prototype, protoProps);
  }
  Visualization.__super__ = parent.prototype;
  return Visualization;
};

// Expose utils
_extend(Keen.utils, {
  prettyNumber: _pretty_number,
  loadScript: _load_script,
  loadStyle: _load_style
});

// Set flag for script loading
Keen.loaded = false;
