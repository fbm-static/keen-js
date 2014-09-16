function _build_visual(selector, config){
  if (this.visual) {
    this.visual.trigger('remove');
  }
  this.visual = new Keen.Visualization(this, selector, config);
}

