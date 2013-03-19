var express = require('express'),
    app = express.createServer(),    
    passport = require('passport'),
    port = process.env.PORT || 8081,
    config = require('./config.js'),
    util = require('util'),
    log = require('winston'),
    PushAPIClient = require('./lib/apiclient'),
    YammerStrategy = require('passport-yammer').Strategy;

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
    // Initialize Passport!  Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    // Tell the Express framework where to find our static files
    app.use(express.static(__dirname + '/public'));
});

// Passport session setup and serialization
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

if(config.auth.disabled) {
  console.log("************");
  console.log("WARNING: You are running with config.auth.disabled true; anyone with access to the application's URL will be able to see your company's stream.")
  console.log("************");

  app.get("/", require('./routes/routes')(config).index);  
}
else {
  passport.use(new YammerStrategy({
      clientID: config.credentials.YAMMER_CONSUMER_KEY,
      clientSecret: config.credentials.YAMMER_CONSUMER_SECRET,
      callbackURL: "/auth/yammer/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      // check if the user belongs to the correct network and if not, kick them out
      if(profile._json.network_domains.indexOf(config.network_domain) == -1) {
        log.error("User does not belong to the " + config.network_domain + " network");
        return(done(
          "Sorry, you do not belong to the Yammer network that has been configured for this application",
          null
        ));
      }
      else {
        log.debug("User belongs to network " + config.network_domain);
        return(done(null, profile));
      }    
    }
  ));

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
  }    

  var routes = require('./routes/routes')(config);
  app.get("/", ensureAuthenticated, routes.index);
  app.get('/login', routes.login);
  // Initiate the Oauth authentication flow - please note that the request will be redirected to Yammer for authentication, 
  // so this function's callback will not be called.
  app.get('/auth/yammer', passport.authenticate('yammer'), function(req, res){});
  // completes the authentication process
  app.get('/auth/yammer/callback', passport.authenticate('yammer', { failureRedirect: '/login' }), routes.callback);
  app.get('/logout', routes.logout);
}

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