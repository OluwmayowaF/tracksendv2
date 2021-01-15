var express = require('express');
var router = express.Router();
const path = require('path');

var adminController = require('../controllers/adminController');

// Requiring our custom middleware for checking if a user is logged in
var isAdministrator = require("../config/middleware/isAdministrator");
//
module.exports = function(app) {
  
  app.get('/admin/',                isAdministrator, adminController.index);
  app.get('/admin/perfcontacts',    isAdministrator, adminController.perfcontacts);
  app.get('/admin/perfcampaigns',   isAdministrator, adminController.perfcampaigns);
  app.post('/admin/uploadperfcontacts',   isAdministrator, adminController.uploadPerfContacts);
  app.get('/admin/countries',       isAdministrator, adminController.countries);
  app.post('/admin/countries',      isAdministrator, adminController.addCountry);
  app.post('/admin/updatecountry',  isAdministrator, adminController.updateCountry);
  // app.use('/admin/perfcampaigns', perfcampaignRouter);
  app.get('/admin/m_a_n_u_a_l',     isAdministrator, adminController.manualget);
  app.post('/admin/m_a_n_u_a_l',    isAdministrator, adminController.manualpost);
  app.get('/admin/testerly',        isAdministrator, adminController.testerly);
  app.get('/admin/permissions', isAdministrator, adminController.permissions);
  app.post('/admin/permissions', isAdministrator, adminController.addPermission);
  app.get('/admin/roles', isAdministrator, adminController.roles);
  app.post('/admin/role', isAdministrator, adminController.addRole);
  app.get('/admin/userroles', isAdministrator, adminController.userRoles);
  app.post('/admin/userrole', isAdministrator, adminController.assignRole);


  
  // app.get('/admin/m_a_n_u_a_l', isAdministrator, (req, res) => {
  //   res.send('yeaaah');
  // });


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
  // Here we've add our isAdministrator middleware to this route.
  // If a user who is not logged in tries to access this route they will be 
  //redirected to the signup page
  /* app.get("/members", isAdministrator, function(req, res) {
    res.sendFile(path.join(__dirname, "../public/members.html"));
  }); */
};


// module.exports = router;