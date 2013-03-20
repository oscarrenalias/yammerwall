/**
 * Configures the app to use Yammer's OAuth2 authentication
 */
var YammerStrategy = require('passport-yammer').Strategy,
    passport = require('passport'),
    log = require('winston');

module.exports = function(app, config) {
  console.log("Enabling Yammer OAuth authentication");

  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport session setup and serialization
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  passport.use(new YammerStrategy({
      clientID: config.auth.oauth.key /*config.credentials.YAMMER_CONSUMER_KEY*/,
      clientSecret: config.auth.oauth.secret /*config.credentials.YAMMER_CONSUMER_SECRET*/,
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

  var routes = require('../../routes/routes')(config);
  var authRoutes = require('../../routes/routes.auth.js')(config);
  app.get("/", ensureAuthenticated, routes.index);
  app.get('/login', authRoutes.login);
  // Initiate the Oauth authentication flow - please note that the request will be redirected to Yammer for authentication, 
  // so this function's callback will not be called.
  app.get('/auth/yammer', passport.authenticate('yammer'), function(req, res){});
  // completes the authentication process
  app.get('/auth/yammer/callback', passport.authenticate('yammer', { failureRedirect: '/login' }), authRoutes.callback);
  app.get('/logout', authRoutes.logout);

  return({app:app, config:config});
}