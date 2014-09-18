
(function(lib){
  'use strict';

  var ErrorMessage = Keen.Visualization.extend({
    initialize: function(){
      var errorPlaceholder, errorMessage;

      errorPlaceholder = document.createElement("div");
      errorPlaceholder.className = "keen-error";
      errorPlaceholder.style.borderRadius = "8px";
      errorPlaceholder.style.height = this.height + "px";
      errorPlaceholder.style.width = this.width + "px";

      errorMessage = document.createElement("span");
      errorMessage.style.color = "#ccc";
      errorMessage.style.display = "block";
      errorMessage.style.paddingTop = (this.height / 2 - 15) + "px";
      errorMessage.style.fontFamily = "Helvetica Neue, Helvetica, Arial, sans-serif";
      errorMessage.style.fontSize = "21px";
      errorMessage.style.fontWeight = "light";
      errorMessage.style.textAlign = "center";

      errorMessage.innerHTML = this['error'].message;
      errorPlaceholder.appendChild(errorMessage);

      this.el.innerHTML = "";
      this.el.appendChild(errorPlaceholder);
    }
  });

  Keen.Visualization.register('keen-io', {
    'error': ErrorMessage
  });

})(Keen);
