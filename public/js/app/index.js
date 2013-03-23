//
// Instantiates and runs the application that is responsible for the index ("/") page. The actual implementation of the
// applications are avaliable in index/main.js and stats/main.js
//
define(["index/main", "stats/main"], function(indexApp, statsApp) {
  $(document).ready(function() {
      indexApp.init();
      statsApp.init();
  });
})
