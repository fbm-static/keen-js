            
Keen.Spinner.defaults = {
  lines: 10, // The number of lines to draw
  length: 8, // The length of each line
  width: 3, // The line thickness
  radius: 10, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#4d4d4d', // #rgb or #rrggbb or array of colors
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: false, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'keen-spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: '50%', // Top position relative to parent
  left: '50%' // Left position relative to parent
};            

// Visual defaults
Keen.Visualization.defaults = {
  library: 'google',
  height: 400,
  colors: [
    "#00afd7",
    "#f35757",
    "#f0ad4e",
    "#8383c6",
    "#f9845b",
    "#49c5b1",
    "#2a99d1",
    "#aacc85",
    "#ba7fab"
  ],
  chartOptions: {}
};

// Collect and manage libraries
Keen.Visualization.libraries = {};
Keen.Visualization.dependencies = {
  loading: 0,
  loaded: 0,
  urls: {}
};
Keen.Visualization.visuals = [];

