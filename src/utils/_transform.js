// -------------------------------
// Dataform Configuration
// -------------------------------
// Handles arbitrary raw data for
// scenarios where originating
// queries are not known
// -------------------------------
function _transform(response, config){
  var self = this, schema = config || {}, dataform;

  // Metric
  // -------------------------------
  if (typeof response.result == "number"){
    //return new Keen.Dataform(response, {
    schema = {
      collection: "",
      select: [{
        path: "result",
        type: "string",
        label: "Metric",
        format: false,
        method: "Keen.utils.prettyNumber",
        replace: {
          null: 0
        }
      }]
    }
  }

  // Everything else
  // -------------------------------
  if (response.result instanceof Array && response.result.length > 0){

    // Interval w/ single value
    // -------------------------------
    if (response.result[0].timeframe && (typeof response.result[0].value == "number" || response.result[0].value == null)) {
      schema = {
        collection: "result",
        select: [
          {
            path: "timeframe -> start",
            type: "date"
          },
          {
            path: "value",
            type: "number",
            format: "10",
            replace: {
              null: 0
            }
          }
        ],
        sort: {
          column: 0,
          order: 'asc'
        }
      }
    }

    // Static GroupBy
    // -------------------------------
    if (typeof response.result[0].result == "number"){
      schema = {
        collection: "result",
        select: [],
        sort: {
          column: 1,
          order: "desc"
        }
      };
      for (var key in response.result[0]){
        if (response.result[0].hasOwnProperty(key) && key !== "result"){
          schema.select.push({
            path: key,
            type: "string"
          });
          break;
        }
      }
      schema.select.push({
        path: "result",
        type: "number"
      });
    }

    // Grouped Interval
    // -------------------------------
    if (response.result[0].value instanceof Array){
      schema = {
        collection: "result",
        unpack: {
          index: {
            path: "timeframe -> start",
            type: "date"
          },
          value: {
            path: "value -> result",
            type: "number",
            replace: {
              null: 0
            }
          }
        },
        sort: {
          value: "desc"
        }
      }
      for (var key in response.result[0].value[0]){
        if (response.result[0].value[0].hasOwnProperty(key) && key !== "result"){
          schema.unpack.label = {
            path: "value -> " + key,
            type: "string"
          }
          break;
        }
      }
    }

    // Funnel
    // -------------------------------
    if (typeof response.result[0] == "number"){
      schema = {
        collection: "",
        unpack: {
          index: {
            path: "steps -> event_collection",
            type: "string"
          },
          value: {
            path: "result -> ",
            type: "number"
          }
        }
      }
    }

  }

  // Trim colorMapping values
  // -------------------------------
  if (self.colorMapping) {
    _each(self.colorMapping, function(v,k){
      self.colorMapping[k] = v.trim();
    });
  }

  // Apply formatting options
  // -------------------------------

  // If key:value replacement map
  if (self.labelMapping && _type(self.labelMapping) == 'Object') {

    if (schema.unpack) {
      if (schema.unpack['index']) {
        schema.unpack['index'].replace = schema.unpack['index'].replace || self.labelMapping;
      }
      if (schema.unpack['label']) {
        schema.unpack['label'].replace = schema.unpack['label'].replace || self.labelMapping;
      }
    }

    if (schema.select) {
      _each(schema.select, function(v, i){
        schema.select[i].replace = self.labelMapping;
      });
    }

  }

  dataform = new Keen.Dataform(response, schema);

  // If full replacement (post-process)
  if (self.labelMapping && _type(self.labelMapping) == 'Array') {
    if (schema.unpack && dataform.table[0].length == 2) {
      _each(dataform.table, function(row,i){
        if (i > 0 && self.labelMapping[i-1]) {
          dataform.table[i][0] = self.labelMapping[i-1];
        }
      });
    }
    if (schema.unpack && dataform.table[0].length > 2) {
      _each(dataform.table[0], function(cell,i){
        if (i > 0 && self.labelMapping[i-1]) {
          dataform.table[0][i] = self.labelMapping[i-1];
        }
      });
    }
  }

  return dataform;
}
