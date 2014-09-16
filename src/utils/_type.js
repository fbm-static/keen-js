
function _type(obj){
  var text, parsed;
  text = (obj && obj.constructor) ? obj.constructor.toString() : void 0;
  if (text) {
    parsed = text.split("(")[0].split(/function\s*/);
    if (parsed.length > 0) {
      return parsed[1];
    }
  }
  return "Null";
  //return (text) ? text.match(/function (.*)\(/)[1] : "Null";
}
