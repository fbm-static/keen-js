function _load_style(url, cb) {
  var link = document.createElement('link');

  link.setAttribute('rel', 'stylesheet');

  link.type = 'text/css';

  link.href = url;
  cb();

  document.head.appendChild(link);

}
