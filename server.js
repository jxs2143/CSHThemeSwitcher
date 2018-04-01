require('dotenv').config();

var express = require('express');
var passport = require('passport');
var Strategy = require('passport-openidconnect').Strategy;
var mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI);

var db = mongoose.connection;
var User;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  var userSchema = mongoose.Schema({
    uid: String,
    css: String
  });

  User = mongoose.model('User', userSchema);
});


// Configure the OpenID Connect strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing APIs on the user's behalf, along
// with the user's profile.  The function must invoke `cb` with a user object,
// which will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy({
  issuer: 'https://sso.csh.rit.edu/auth/realms/csh',
  authorizationURL: 'https://sso.csh.rit.edu/auth/realms/csh/protocol/openid-connect/auth',
  tokenURL: 'https://sso.csh.rit.edu/auth/realms/csh/protocol/openid-connect/token',
  userInfoURL: 'https://sso.csh.rit.edu/auth/realms/csh/protocol/openid-connect/userinfo',
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/login/callback'
},
                          function(accessToken, refreshToken, profile, cb) {
  // In this example, the user's profile is supplied as the user record.
  // In a production-quality application, the profile should be associated
  // with a user record in the application's database, which allows for
  // account linking and authentication with other identity providers.
  return cb(null, profile);
}));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
//app.use(require('morgan')('combined'));
//app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
/*app.get('/',
        function(req, res) {
  res.send("Root");

  //res.render('home', { user: req.user });
});*/

app.get('/login',
        passport.authenticate('openidconnect'));

app.get('/login/callback',
        passport.authenticate('openidconnect', { failureRedirect: '/login' }),
        function(req, res) {
  res.redirect('/');
});

/*app.get('/profile',
        require('connect-ensure-login').ensureLoggedIn(),
        function(req, res){
  res.send("Response");
  //res.render('profile', { user: req.user });
});*/

app.get('/user/:userID',
        require('connect-ensure-login').ensureLoggedIn(),
        function(req, res) {
  User.findOne({ 'uid' : req.params.userID }, function(err, user) {
    if(user != null) res.send(user.css);
    else {
      res.send(process.env.DEFAULT_CSS);
      if(err != null) console.error(err);
    }
  });
});
app.get('/user/:userID/:css',
        require('connect-ensure-login').ensureLoggedIn(),
        function(req, res) {
  User.findOne({ 'uid' : req.params.userID}, function(err, user) {
    if(err) console.error(err);
    else {
      console.log(req.params.userID + " : " + req.params.css);
      if(user == null) {
        var u = new User({ uid: req.params.userID, css: req.params.css });
        u.save(function(err, u) {
        });
      }
      else {
        user.css = req.params.css;
        user.save(function(err, user) {
          if(err) console.error(err);
        });
      }
    }
  });
  res.send('Submitted');
});

//app.listen(parseInt(process.env.PORT));