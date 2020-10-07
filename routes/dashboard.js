var express = require('express');
var router = express.Router();
const path = require('path');

var dashboardController = require('../controllers/DashboardController');

// const dashboardRouter = require('./contacts');
const contactRouter = require('./contacts');
const campaignRouter = require('./campaigns');
const perfcampaignRouter = require('./perfcampaigns');
const senderIdRouter = require('./senderids');
const topupRouter = require('./topups');
const shortLinkRouter = require('./shortlinks');
const uploadRouter = require('./upload');
const profileRouter = require('./profile');
const integrationRouter = require('./integrations');
const CustomOptinRouter = require('./customoptins');

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
// var isAdministrator = require("../config/middleware/isAdministrator");
//
module.exports = function(app) {
  
  app.get('/dashboard/',                isAuthenticated, dashboardController.index);
  app.use('/dashboard/contacts',        isAuthenticated, contactRouter);
  app.use('/dashboard/campaigns',       isAuthenticated, campaignRouter);
  app.use('/dashboard/perfcampaigns',   isAuthenticated, perfcampaignRouter);
  // app.use('/dashboard/perfcampaigns', perfcampaignRouter);
  app.use('/dashboard/senderids',       isAuthenticated, senderIdRouter);
  app.use('/dashboard/shortlinks',      isAuthenticated, shortLinkRouter);
  app.use('/dashboard/shorturls',       isAuthenticated, shortLinkRouter);
  app.use('/dashboard/topups',          isAuthenticated, topupRouter);
  app.use('/dashboard/upload',          isAuthenticated, uploadRouter);
  app.use('/dashboard/profile',         isAuthenticated, profileRouter);
  app.use('/dashboard/integrations',    isAuthenticated, integrationRouter);
  app.use('/dashboard/customoptin',     isAuthenticated, CustomOptinRouter);
  // app.get('/dashboard/m_a_n_u_a_l',     isAdministrator, dashboardController.manualget);

  
  // app.get('/dashboard/m_a_n_u_a_l', isAdministrator, (req, res) => {
  //   res.send('yeaaah');
  // });
  // app.post('/dashboard/m_a_n_u_a_l', isAdministrator, dashboardController.manualpost);

  // app.get('/dashboard/testerly', isAdministrator, dashboardController.testerly);

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