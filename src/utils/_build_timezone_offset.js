function _build_timezone_offset(){
  return new Date().getTimezoneOffset() * -60;
}
