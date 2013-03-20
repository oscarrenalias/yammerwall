var express = require('express'),
  app = express.createServer(),        
  port = process.env.PORT || 8081,
  config = require('./config.js'),
  util = require('util'),
  //passport = require('passport'),
  PushAPIClient = require('./lib/apiclient');

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  // access log is a bit too chatty, let's switch it off during developmet
  if(config.mode() == "prod")   
    app.use(express.logger()) ;

  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: '*#sURcTCeALkyJPhCv$dCk*d@rav4*A$' }));
  
  // Dynamically configure authentication. The nasty part is that we're passing the 'app' object
  // by reference and modifying it in the auth configuration module... should find a better way to do it
  require("./lib/auth/auth." + config.auth.type + ".js")(app, config);

  app.use(app.router);
  // Tell the Express framework where to find our static files
  app.use(express.static(__dirname + '/public'));  
});

// RESTful JSON routes with the statistics
// TODO: we can probably replace all these hand-coded routes with a catch-all /stats/collections/:coll-id
// and with a smarter router/controller that will know to which collection to route it
var statsRoutes = require('./routes/routes.stats.js')(config)
app.get("/stats/collections/top_users", statsRoutes.top_users)
app.get("/stats/collections/top_topics", statsRoutes.top_topics)
app.get("/stats/collections/top_threads", statsRoutes.top_threads)
app.get("/stats/collections/top_clients", statsRoutes.top_clients)
app.get("/stats/collections/hourly_activity", statsRoutes.hourly_activity)
app.get("/stats", statsRoutes.ui)

// connect and set up the handlers
var pushAPIClient = PushAPIClient(config);
pushAPIClient.on("data", require('./lib/handlers/clients').handler(config, app));
pushAPIClient.on("data", require('./lib/handlers/diskwriter').handler(config, app));
pushAPIClient.on("data", require('./lib/analytics/handler').handler(config, app));
pushAPIClient.on("fatal", require('./lib/handlers/fatal.js').handler(config, app));
pushAPIClient.start();
    
// start the application
app.listen(port);
console.log("Server started in port: " + port);