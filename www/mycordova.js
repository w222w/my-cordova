var argscheck = require('cordova/argscheck');
var exec = require('cordova/exec');


var myCordova = {};

myCordova.version = '0.0.1';
myCordova.getVersion = function(){
  return this.version;
};

module.exports = myCordova;
