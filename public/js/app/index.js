//
// Instantiates and runs the application that is responsible for the index ("/") page. The actual implementation of the
// application is avaliable in index/main.js
//
define(["index/main"], function(app) {
  $(document).ready(function() {
    app.init();
  });
})
