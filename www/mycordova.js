window.mycordova = (function() {
    /*cordova.exec(callback, function(err) {
        callback('Nothing to echo.');
    }, "Echo", "echo", [str]);
    */
    
    return {
      version: '0.0.1',
      getVersion(){
      return this.version;
      }
    
    };
    
})();