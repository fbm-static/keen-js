  /*!
  * ----------------------
  * Keen IO Plugin
  * Data Visualization
  * ----------------------
  */

  !function(name, context){
    var Keen = context[name] || {};
    var cs = context.chartstack;
    Keen.vis = cs; //.noConflict();
    Keen.Chart = function(obj){
      return new Keen.vis.Chart(obj);
    };
    Keen.ready = Keen.vis.ready;
    Keen.vis.addAdapter('default', Keen.vis.adapters['keen-io']);

    Keen.vis.defaults = Keen.vis.defaults || {};
    Keen.vis.defaults.colors = [
      '#00afd7', // blue
      '#49c5b1', // green
      '#e6b449', // gold
      '#f35757'  // red
    ];

    // -------------------------------
    // Inject Draw Methods
    // -------------------------------

    Keen.prototype.draw = function(query, selector, config) {
      var stub = new Keen.Request(this, [query]);
      return new Keen.Visualization(stub, selector, config);
    };

    Keen.Request.prototype.draw = function(selector, config) {
      if (!this.visual) {
        this.visual = new Keen.Visualization(this, selector, config);
        this.on("complete", function(){
          this.visual.dataset.resources[0].url = this.instance.client.endpoint + '/projects/' + this.instance.client.projectId + this.queries[0].path;
          this.visual.dataset.resources[0].dateformat = config.dateFormat || "";
          this.visual.dataset.resources[0].params = this.queries[0].params;
          this.visual.dataset.resources[0].params.api_key = this.instance.client.readKey;
          
          this.visual.dataset.responses = [this.data];
          this.visual.dataset.transform();
        });
      }
      return this;
    };

    // -------------------------------
    // Keen.Visualization
    // -------------------------------

    Keen.Visualization = function(req, selector, config){
      var options = (config || {}), recommended;
      var library = Keen.vis.libraries[options.library] || Keen.vis.library;
      var datasetConfig = {
        adapter: "keen-io",
        dateformat: options.dateFormat || ""
      };

      var viewConfig = {
        el: selector,
        chartOptions: options.chartOptions || {}
      };
      viewConfig.chartOptions.colors = viewConfig.chartOptions.colors || Keen.vis.defaults.colors;

      if (req.queries[0].params.interval) { // Series
        options.capable = ['areachart', 'barchart', 'columnchart', 'linechart', 'table'];
        recommended = 'linechart';
      } else {
        if (req.queries[0].params.group_by) { // Static
          options.capable = ['piechart', 'barchart', 'columnchart', 'table'];
          recommended = 'barchart';
        } else { // Metric
          options.capable = ['metric'];
          recommended = 'metric';
        }
      }

      // 2x Group_by handler
      if (req.queries[0].params.group_by instanceof Array) {
        options.capable = ['areachart', 'barchart', 'columnchart', 'linechart', 'table'];
        recommended = 'columnchart';
        datasetConfig.map = {
          root: 'result',
          //each: {},
          sort: {
            index: 'asc',
            label: 'desc'
          }
        };
        if (req.queries[0].params.interval) {
          datasetConfig.map.each = {
            label: 'value -> ' + req.queries[0].params.group_by[0],
            index: 'timeframe -> start',
            value: 'value -> result'
          };
        } else {
          datasetConfig.map.each = {
            label: req.queries[0].params.group_by[1],
            index: req.queries[0].params.group_by[0],
            value: 'result'
          };
        }
      }

      if (req.queries[0].params.steps) {
        options.capable = ['areachart', 'barchart', 'columnchart', 'linechart', 'table'];
        recommended = 'columnchart';
        /*datasetConfig.map = {
          root: '',
          each: {
            //index: 'steps -> event_collection',
            label: 'steps -> event_collection',
            value: 'result'
          },
          sort: {
            index: 'asc'
            //label: 'desc'
          }
        };*/
      }


      options.chartType = options.chartType || recommended;

      if (viewConfig.title == void 0) {
        viewConfig.title = (function(){
          var output = req.queries[0].analysis.toUpperCase();
          if (req.queries[0].get('event_collection') !== null) {
            output += ': ' + req.queries[0].get('event_collection').toUpperCase();
          }
          return output;
        })()
        //console.log(req.queries[0].params);
        //viewConfig.chartOptions.title =  + req.queries[0].get('event_collection').toUpperCase();
      }

      if (options.chartType == 'metric') {
        library = 'keen-io';
      }

      if (library) {
        if (Keen.vis.libraries[library][options.chartType]) {
          return new Keen.Chart({
            dataset: new Keen.vis.Dataset(datasetConfig),
            view: new Keen.vis.libraries[library][options.chartType](viewConfig)
          })

        } else {
          Keen.log('The visualization type you requested is not available for this library');
        }
      } else {
        //console.log(req.queries[0].params.group_by instanceof Array);
        Keen.log('The visualization library you requested is not present');
      }

      return this;
    };
  }('Keen', this);
