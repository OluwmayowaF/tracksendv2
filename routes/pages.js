var express = require('express');
var router = express.Router();
const path = require('path');

const redirectRouter = require('../routes/redirect');

// const app = express();
// app.use(express.static(path.join(__dirname, 'static')));

/* router.get('/',(req, res) => res.render('pages/dashboard/dashboard', {
  page: 'DASHBOARD',

})); */

// router.get('/', dashboardController.index);
// router.use('/contacts', contactRouter);
// router.use('/campaigns', campaignRouter);
// router.use('/senderids', senderIdRouter);
// router.use('/topups', topupRouter);
// router.use('/upload', uploadRouter);

// Requiring our custom middleware for checking if a user is logged in
// var isAuthenticated = require("../config/middleware/isAuthenticated");
//
module.exports = function(app) {
  //
  app.get('/', (req, res) => res.render('pages/home', {
    layout: 'main',
    page: 'HOME',
    auth: (req.user) ? true : false,
    flash: {
      type: req.flash('type'),
      msg: req.flash('msg'),
    },
  }));

  app.get('/login', (req, res) => res.render('pages/login', {
    layout: 'main',
    page: 'LOGIN',
    auth: (req.user) ? true : false,
    flash: {
      type: req.flash('type'),
      msg: req.flash('msg'),
    },
  }));

  app.get('/register', (req, res) => res.render('pages/register', {
    layout: 'main',
    page: 'REGISTER',
    auth: (req.user) ? true : false,
    flash: {
      type: req.flash('type'),
      msg: req.flash('msg'),
    },
  }));

  app.get("/logout", function(req, res) {
    req.logout();
    
    req.flash('type', 'success');
    req.flash('msg', "You've been successfully logged out.");
    res.redirect("/");
  });

  app.use('/redirect', redirectRouter);
  
};


// module.exports = router;