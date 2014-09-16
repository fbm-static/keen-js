function _set_protocol(value) {
  switch(value) {
    case 'http':
      return 'http';
      break;
    case 'auto':
      return location.protocol.replace(/:/g, '');
      break;
    case 'https':
    case undefined:
    default:
      return 'https';
      break;
  }
}