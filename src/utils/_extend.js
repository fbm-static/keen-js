function _extend(target){
  for (var i = 1; i < arguments.length; i++) {
    for (var prop in arguments[i]){
      // if ((target[prop] && _type(target[prop]) == 'Object') && (arguments[i][prop] && _type(arguments[i][prop]) == 'Object')){
      target[prop] = arguments[i][prop];
    }
  }
  return target;
}
