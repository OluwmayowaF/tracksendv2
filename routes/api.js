var express = require('express');
var router = express.Router();
// var contactController = require('../controllers/ContactController');
var apiController = require('../controllers/ApiController');
var customOptinController = require('../controllers/CustomOptinController');
var zapierRouter = require('./zapier');

// Home page route.
// router.get('/groupconts', apiController.getContacts);
// router.get('/generateurl', apiController.generateUrl);
// router.post('/analysecampaign', apiController.analyseCampaign);


// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");
var cors = require("cors");
//
module.exports = function(app) {
  app.get ('/api/getgroups',        apiController.getGroups);
  app.get ('/api/groupconts',       apiController.getContacts);
  app.get ('/api/getclients',       apiController.getClients);
  app.post('/api/savesenderid',     apiController.saveSenderId);
  app.get ('/api/delsenderid',      apiController.delSenderId);
  app.post('/api/ext/newgroup',     apiController.newGroup);       //  external API access
  app.post('/api/ext/updategroup',  apiController.updateGroup);    //  external API access
  app.post('/api/ext/newcampaign',  apiController.newCampaign);    //  external API access
  app.post('/api/savegroup',        apiController.saveGroup);
  app.get ('/api/delgroup',         apiController.delGroup);
  app.get ('/api/delcampaign',      apiController.delCampaign);
  app.post('/api/savecontact',      apiController.saveContact);
  app.get ('/api/delcontact',       apiController.delContact);
  app.get ('/api/generateurl',      apiController.generateUrl);
  app.post('/api/analysecampaign',  apiController.analyseCampaign);
  app.get ('/api/loadcampaign',     apiController.loadCampaign);
  app.get ('/api/savecustomoptinlink', apiController.saveOptinLink);
  app.get ('/api/getwhatsappqrode', apiController.getWhatsAppQRCode);
  app.options ('/api/whatsappoptin', cors()); // deprecated
  app.post ('/api/whatsappoptin', cors(), apiController.whatsAppOptIn); //  deprecated

  app.options ('/api/messageoptin', cors());      //  from tsnwhatsappoptin api on external webpage
  app.post('/api/messageoptin', cors(), apiController.messageOptIn);     //  from tsnwhatsappoptin api on external webpage

  app.post('/api/sms/kirusa/notify',         apiController.smsNotifyKirusa);            //  for KIRUSA
  app.post('/api/sms/infobip/notify',        apiController.smsNotifyInfobip);           //  for INFOBIP
  app.get ('/api/sms/messagebird/notify',    apiController.smsNotifyMessagebird);       //  for MESSAGEBIRD
  app.get ('/api/sms/africastalking/notify', apiController.smsNotifyAfricastalking);    //  for MESSAGEBIRD

  app.post('/api/whatsapphooks',    apiController.whatsAppNotify);

  app.post('/api/customoptin/add/question',           customOptinController.addquestion);   
  app.delete('/api/customoptin/delete/question/:id',  customOptinController.delquestion);   
  // app.post('/api/customoptin/save',                   customOptinController.saveoption);   
  
  app.use ('/api/zapier', zapierRouter);     //  from tsnwhatsappoptin api on external webpage

  
  
  
  
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), function(req, res) {
    // Since we're doing a POST with javascript, we can't actually redirect that post into a GET request
    // So we're sending the user back the route to the members page because the redirect will happen on the front end
    // They won't get this or even be able to access this page if they aren't authed
    // res.json('{"response":"autheticated"}');
    res.json(["autheticated"]);
  });
//
  // Route for signing up a user. The user's password is automatically hashed and stored securely thanks to
  // how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in,
  // otherwise send back an error

  app.post("/api/register", async function(req, res) {
    var mgauth = require('../config/cfg/mailgun')();
    const mailgun = require('mailgun-js')({apiKey: mgauth.APIKEY, domain: mgauth.DOMAIN});
    const randgen = require('../my_modules/randgen');
    let pk = await randgen('api_key', db.User, 50, 'fullalphnum', '_');

    console.log(req.body); 
    req.body.api_key = pk;
    console.log('====================================');
    console.log(JSON.stringify(req.body));
    console.log('====================================');

    try {
      let user = await db.User.create(req.body);
      // res.redirect(307, "/api/login");
      console.log('111111');
      //  then create the [Uncategorized] group for the new user
      await db.Group.create({
        name: '[Uncategorized]',
        description: 'For all contacts without distinct groups.',
        userId: user.id,
      })

      //  send mail to notify someone
      var data = {
        from: 'Tracksend <info@tracksend.co>',
        to: 'New User <newuser@tracksend.co>',
        subject: 'Tracksend: New User Registered.',
        text: 'A new user called ' + req.body.name + ' (' + req.body.business + ') has just been registered.',
      };
      
      mailgun.messages().send(data, function (error, body) {
      console.log('mail error: ' + JSON.stringify(error));
      console.log('mail body: ' + JSON.stringify(body));
      });
    
      req.login(user, () => {
        console.log('222222');
        req.flash('success', 'Registration successful. Welcome to Tracksend.');
        console.log('33333');
        res.json(["registered"]);
      });
    } catch(err) {
      console.log(err);
      res.json(err);
      // res.status(422).json(err.errors[0].message);
    };
  });
//
  // Route for logging user out
/*   app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });
 *///
  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", function(req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    }
    else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.email,
        id: req.user.id
      });
    }
  });
};


// module.exports = router;