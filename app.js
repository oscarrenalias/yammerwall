var express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app),
    passport = require('passport'),
    port = process.env.PORT || 8081,
    config = require('./config.js'),
    util = require('util'),
    log = require('winston'),
    YammerStrategy = require('passport-yammer').Strategy,
    YammerPushAPI = require('yammer-push-api-client'),
    YammerAPIClient = require('yammer-rest-api-client'),
    apiClient = new YammerAPIClient({token: config.oauth_token}),
    devSupport = require('./lib/devsupport.js');

// configure Express
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    
    // access log is a bit too chatty, let's switch it off during developmet
    if(config.mode == "prod")   
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

if(config.skip_auth) {
  console.log("************");
  console.log("WARNING: You are running with skip_auth true; anyone with access to the application's URL will be able to see your company's stream.")
  console.log("************");

  app.get("/", function(req, res) {
      res.render("index-noauth", { user: req.user, config:config, title: "YammerPoll" });
  });  
}
else {
  // Use the YammerStrategy within Passport.
  //   Strategies in Passport require a `verify` function, which accept
  //   credentials (in this case, an accessToken, refreshToken, and Yammer
  //   profile), and invoke a callback with a user object.
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

  app.get("/", ensureAuthenticated, function(req, res) {
      res.render("index", { user: req.user, config: config, title: "YammerPoll" });
  });

  app.get('/login', function(req, res){
    res.render('login', { user: req.user, title: "Login" });
  });

  // Initiate the Oauth authentication flow
  app.get('/auth/yammer',
    passport.authenticate('yammer'),
    function(req, res){
      // The request will be redirected to Yammer for authentication, so this function will not be called.
    });

  // completes the authentication process
  app.get('/auth/yammer/callback', 
    passport.authenticate('yammer', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });  
}


// This sets up a route that allows us to send random yams for development
if(config.mode == "dev") {
  console.log("DEV mode activated, setting up route in /dev/sendyam");
  devSupport.configureDevRoutes(app, io);
}

// handling of socket.io connections
io.sockets.on('connection', function (socket) {
    console.log("New client added");
    socket.join('yammer');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}  

// extracts the list of users from the references section
function processReferences(references) {
    return({
      users: references.filter(function(item) {
        return(item.type == "user");
      }),
      threads: references.filter(function(item) {
        return(item.type == "thread");
      }),
      messages: references.filter(function(item) {
        return(item.type == "message");
      }),
      tags: references.filter(function(item) {
        return(item.type == "tag");
      }),
      topics: references.filter(function(item) {
        return(item.type == "topic");
      })
    });    
}

var pushAPIClient = new YammerPushAPI(config.oauth_token, { type: "all" });
pushAPIClient.on("data", function(data) {
    // this callback is trigger every time there's new data from the API
    data.map(function(yam) {
        console.log("Processing response with id = " + /*data[i].id*/ yam.id);
        // process data in the respose depending on its type
        if(yam.data) {
            // not all messages have data to process
            if(yam.data.type == "message") {
                io.sockets.in("yammer").emit(
                    "yam", 
                    { 
                      messages: yam.data.data.messages,
                      references: processReferences(yam.data.data.references)
                    }
                );
            }
            else {
                console.log("There was no message data to process");
            }                                                
        }
    });
});

pushAPIClient.on("fatal", function(error) {
  console.log("There was an error connecting to the real-time API, please check the OAuth configuration. Exiting...");
  process.exit(-1);
})

pushAPIClient.start();
    
// start the application
app.listen(port);
console.log("Server started in port: " + port);
