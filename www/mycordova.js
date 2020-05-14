var argscheck = require('cordova/argscheck');
var exec = require('cordova/exec');


var myCordova = {
  version: '0.0.1',
  getVersion: function(){
    return this.version;
  },
  init: function(){
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
  },
  onDeviceReady: function(){
    if(navigator.splashscreen){
    navigator.splashscreen.hide();
    }
  }
};

myCordova.init();

module.exports = myCordova;
