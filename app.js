const express    = require('express');
const exphbs     = require('express-handlebars');
const { hbs }    = require('./my_modules/handlebarhelpers')();
const bodyParser = require('body-parser');
const path       = require('path');
const fileUpload = require('express-fileupload');
// const MongoClient = require('mongodb').MongoClient;
// var handlebars = require('handlebars');
// Requiring passport as we've configured it
var passport     = require("./config/passport");

var cookieParser = require('cookie-parser');
var session      = require('express-session');
var flash        = require('express-flash');

// const Sequelize = require('sequelize');
// const User = require('./models/User');
// const Contact = require('./models/Contact');

const homeRouter = require('./routes/home');
const dashboardRouter = require('./routes/dashboard');
const apiRouter = require('./routes/api');

const app = express(); 

var sessionStore = new session.MemoryStore;

const PORT = process.env.PORT || 3000;

//  set view engine
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// var hbs_ = hbs.create({});
// var hbs_ = exphbs.create({});
// hbs_.handlebars.registerHelper('increasePrice', function(price) {
//   price += 10;
//   return price;
// })

app.use(fileUpload());
app.use(cookieParser('secret'));
app.use(session({
  cookie: { maxAge: (365 * 24 * 60 * 60 * 1000) },
  store: sessionStore,
  saveUninitialized: true,
  resave: 'true',
  secret: 'secret'
}));
app.use(flash());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text({ type: 'text/*' })); //  to parse text/plain requests
//  set static folder
app.use(express.static(path.join(__dirname, '/static')));
console.log('path is: ' + __dirname);

// We need to use sessions to keep track of our user's login status
app.use(session({ secret: "keyboard cat", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
// app.locals.djt = 'talowanbe!';

//  set routes
// app.get('/', (req, res) => res.send('pages/dashboard/topups'));
/* app.post('/', (req, res) => {
  console.log('form details are all: ' + JSON.stringify(req.body));
}); */

// Requiring our routes
// require("./routes/html-routes.js")(app);
// require("./routes/api-routes.js")(app);


/* const mongo_username = '';
const mongo_password = '';
const mongo_db = 'tracksend';

const mongoconnectionurl = 'mongodb://' + 
                           mongo_username + 
                           (mongo_username ? ':' : '') +
                           mongo_password + 
                           (mongo_password ? '@' : '') +
                           'localhost:27017';
                          //  + mongo_db;
                          console.log('url is ' + mongoconnectionurl);
MongoClient.connect(mongoconnectionurl, { useUnifiedTopology: true, useNewUrlParser: true }, function (err, client) {
  if (err) throw err 

  var mdb = client.db(mongo_db)
  console.log('mongo database connected...');

  // mdb.collection('contacts').insertMany();
  app.use(function(req, res, next) {
    req.mdb = mdb;
    next();
  })

  require("./routes/dashboard")(app);
  require("./routes/api.js")(app);
  require("./routes/pages")(app);
  
  //  init database
  const db = require('./config/cfg/db');
  db.authenticate()
  .then(() => {
    console.log   ('Main Database connected...');
    // console.debug ('1Database connected...');
    // console.info  ('3Database connected...');
    // console.warn  ('4Database connected...');
    // console.error ('5Database connected...');
    // console.clear();
    //  start server
    app.listen(PORT, console.log(`Server running on port ${PORT} ...`));
    // var server = http.createServer(app);
    // server.listen(PORT);
    // console.log(`Server running on port ${PORT} ...`)
  })
  .catch(err => console.log('Error: ' + err));

}) */

require("./routes/admin")(app);
require("./routes/dashboard")(app);
require("./routes/api.js")(app);
require("./routes/pages")(app);

//  init database
const db = require('./config/cfg/db');
db.authenticate()
.then(() => {
  console.log   ('Main Database connected...');
  // console.debug ('1Database connected...');
  // console.info  ('3Database connected...');
  // console.warn  ('4Database connected...');
  // console.error ('5Database connected...');
  // console.clear();
  //  start server
  app.listen(PORT, console.log(`Server running on port ${PORT} ...`));
  // var server = http.createServer(app);
  // server.listen(PORT);
  // console.log(`Server running on port ${PORT} ...`)
})
.catch(err => console.log('Error: ' + err));
