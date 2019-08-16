var express = require('express');
var router = express.Router();
const path = require('path');

var dashboardController = require('../controllers/DashboardController');

// const dashboardRouter = require('./contacts');
const contactRouter = require('./contacts');
const campaignRouter = require('./campaigns');
const senderIdRouter = require('./senderids');
const topupRouter = require('./topups');
const uploadRouter = require('./upload');
const profileRouter = require('./profile');

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
var isAuthenticated = require("../config/middleware/isAuthenticated");
//
module.exports = function(app) {
  //
  app.get('/dashboard/', isAuthenticated, dashboardController.index);
  app.use('/dashboard/contacts', isAuthenticated, contactRouter);
  app.use('/dashboard/campaigns', isAuthenticated, campaignRouter);
  app.use('/dashboard/senderids', isAuthenticated, senderIdRouter);
  app.use('/dashboard/topups', isAuthenticated, topupRouter);
  app.use('/dashboard/upload', isAuthenticated, uploadRouter);
  app.use('/dashboard/profile', isAuthenticated, profileRouter);

/*   app.get("/", function(req, res) {
    // If the user already has an account send them to the members page
    if (req.user) {
      res.redirect("/members");
    }
    res.sendFile(path.join(__dirname, "../public/signup.html"));
  });
 *///
  /* app.get("/login", function(req, res) {
    // If the user already has an account send them to the members page
    if (req.user) {
      res.redirect("/members");
    }
    res.sendFile(path.join(__dirname, "../public/login.html"));
  }); */
//
  // Here we've add our isAuthenticated middleware to this route.
  // If a user who is not logged in tries to access this route they will be 
  //redirected to the signup page
  /* app.get("/members", isAuthenticated, function(req, res) {
    res.sendFile(path.join(__dirname, "../public/members.html"));
  }); */
};


// module.exports = router;