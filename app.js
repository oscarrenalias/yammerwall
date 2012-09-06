var express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app),
    passport = require('passport'),
    port = process.env.PORT || 8081,
    config = require('./config.js'),
    util = require('util'),
    YammerStrategy = require('passport-yammer').Strategy;
    yammerpush = require('./lib/yammer-push-api');

// configure Express
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.logger());
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

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Yammer profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the YammerStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Yammer
//   profile), and invoke a callback with a user object.
passport.use(new YammerStrategy({
    clientID: config.credentials.YAMMER_CONSUMER_KEY,
    clientSecret: config.credentials.YAMMER_CONSUMER_SECRET,
    callbackURL: config.host + port  + "/auth/yammer/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {      
      // To keep the example simple, the user's Yammer profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Yammer account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

app.get("/", ensureAuthenticated, function(req, res) {
    res.render("index", { user: req.user, title: "YammerPoll" });
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

// handling of socket.io connections
io.sockets.on('connection', function (socket) {
    console.log("New client added");
    socket.join('yammer');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}  

// extracts the list of users from the references section
function processUsers(references) {
    return(references.filter(function(item) {
        return(item.type == "user");
    }));
}
    
yammerpush.react(config.oauth_token, function(data) {
    // this callback is trigger every time there's new data from the API
    console.log("Callback triggered!");
    for(i=0; i<data.length; i++) {
        console.log("Processing response with id = " + data[i].id);
        // process data in the respose depending on its type
        if(data[i].data) {
            // not all messages have data to process
            if(data[i].data.type == "message") {
                io.sockets.in("yammer").emit(
                    "yam", { 
                        "messages": data[i].data.data.messages, 
                        "users": processUsers(data[i].data.data.references) 
                });
            }
            else {
                console.log("There was no message data to process");
            }                                                
        }
    }
});

// start the application **
app.listen(port);
console.log("Server started in port: " + port);