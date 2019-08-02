const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');
// const http = require('http');
// var handlebars = require('handlebars');
// Requiring passport as we've configured it
var passport = require("./config/passport");

var cookieParser = require('cookie-parser');
var session = require('express-session');
var flash = require('express-flash');

// const Sequelize = require('sequelize');
// const User = require('./models/User');
// const Contact = require('./models/Contact');

const homeRouter = require('./routes/home');
const dashboardRouter = require('./routes/dashboard');
const apiRouter = require('./routes/api');

const app = express();

var sessionStore = new session.MemoryStore;

const PORT = process.env.PORT || 3000;

/* Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

  switch (operator) {
      case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
          return options.inverse(this);
  }
}); */

//  set view engine
app.engine('handlebars', exphbs({ defaultLayout: 'dashboard' }));
app.set('view engine', 'handlebars');

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
//  set static folder
app.use(express.static(path.join(__dirname, '/static')));
console.log('path is: ' + __dirname);

// We need to use sessions to keep track of our user's login status
app.use(session({ secret: "keyboard cat", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


//  set routes
// app.get('/', (req, res) => res.send('pages/dashboard/topups'));
/* app.post('/', (req, res) => {
  console.log('form details are all: ' + JSON.stringify(req.body));
}); */

// Requiring our routes
// require("./routes/html-routes.js")(app);
// require("./routes/api-routes.js")(app);

require("./routes/dashboard")(app);
require("./routes/api.js")(app);
require("./routes/pages")(app);
//
// app.use('/', homeRouter);
// app.use('/dashboard', dashboardRouter);
// app.use('/api', apiRouter);


//  init database
const db = require('./config/db');
db.authenticate()
  .then(() => {
    console.log('Database connected...');
    //  start server
    app.listen(PORT, console.log(`Server running on port ${PORT} ...`));
    // var server = http.createServer(app);
    // server.listen(PORT);
    // console.log(`Server running on port ${PORT} ...`)
  })
  .catch(err => console.log('Error: ' + err));
