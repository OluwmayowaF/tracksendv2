var express = require('express');
var router = express.Router();
const path = require('path');
var models = require('../models');
const sequelize = require('../config/cfg/db');
var bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const randgen = require('../my_modules/randgen');
var _message = require('../my_modules/output_messages');
var env = require('../config/env');


var msgOptinController = require('../controllers/MessageOptinController');
const redirectRouter = require('../routes/redirect');
const msgRouter = require('../routes/messages');
const smsRouter = require('../routes/sms');
const whatsAppRouter = require('../routes/whatsapp');

module.exports = function(app) {

  app.get('/', (req, res) => 
    {
      var backURL = 'http://tracksend.co'; // req.header('Referer') || '/';
      res.redirect(backURL);
  });

  app.get('/post-migration/tiwex', async (req, res) => {

    res.send('ERROR OOOOOOOOOOOO');
    return;

    //  create default '[uncategorized]' group for all existing users ... AND ... send them all emails to change their passwords
    console.log('====================================');
    console.log("...create default '[uncategorized]' group for all existing users");
    console.log('====================================');

    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    // var testAccount = await nodemailer.createTestAccount();
    var transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'rahsaan.hilll@ethereal.email', // generated ethereal user
            pass: 'fts9U7Q2Q8QUbvrdxw' // generated ethereal password
        },
        //  remove this if you're using a real SMTP service...
        tls: {
          rejectUnauthorized: false
        }
    })
    /* .catch((err) => {
      console.log(err);
      
    }) */

    await models.User.findAll()
    .then(async usrs => {

      await usrs.forEach(usr => {
        //  create default '[uncategorized]' group for all existing users
        models.Group.create({
          name: '[Uncategorized]',
          userId: usr.id,
          description: "This is a default group that holds all contacts that's not grouped",
          count: 0,
        })
        .error((err) => {
          console.log("ERROR: " + err);
        })

        //  send password update mail to all existing users
        console.log("...send password update mail to all existing users");
        //  first generate tokens for each user
        var arr = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9'];

        var len = arr.length;
        var id = '';
        for (let i = 0; i < 64; i++) {
          var r = arr[Math.floor(Math.random() * len)];//.toString();
          id += r;
        }

        models.User.findByPk(usr.id)
        .then(async (uu) => {
          await uu.update({
            update_profile: 0,
            token: id,
          })

          // send mail with defined transport object
          var info = await transporter.sendMail({
              from: '"Tracksend" <info@tracksend.com>', // sender address
              to: '"' + usr.name + '" <' + usr.email + '>', // list of receivers
              subject: 'Hallo ✔', // Subject line
              text: 'Hello ' + usr.name + ', <br><br>Tracksend has upgraded it\'s systems in order to serve you better. As a result, all users are required to update their passwords. Here\'s your password update link: https://dev2.tracksend.co/account/update/password/' + usr.email + '/' + id, // plain text body
              html: '<b>Hello ' + usr.name + '</b>, <br><br>Tracksend has upgraded it\'s systems in order to serve you better. As a result, all users are required to update their passwords. Here\'s your password update link: https://dev2.tracksend.co/account/update/password/' + usr.email + '/' + id, // html body
          });

          console.log('Message sent: %s', info.messageId);
          // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

          // Preview only available when sending through an Ethereal account
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
          // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
          
        })
    
      });

    })

    // ALSO migrate all network rate settings (`settingsnetworks`)
    console.log('====================================');
    console.log("...migrate all network rate settings (`settingsnetworks`)");
    console.log('====================================');

    await sequelize.query("SELECT * FROM settings_telco")
    .then(async ([results, metadata]) => {
          console.log(results);
          // return results;

          await results.forEach(res => {

            let prfs = res.phone_string;
            let starr = prfs.split(',');
            console.log('0000');

            starr.forEach(res_ => {
              console.log('1111111');
              
              var prefix = "0" + res_.substr(3);
              models.Settingsnetwork.create({
                name: res.telco_name,
                prefix,
                cost: res.unit_no,
                countryId: 234,
              })
              .error((err) => {
                console.log("ERROR: " + err);
              })
            });
          });
    })

    res.send('DONE!!!');
    //  THE END!
  });

  app.get('/sanitize-contacts/tiwex', async (req, res) => {

    res.send('ERROR OOOOOOOOOOOO');
    return;

    const Sequelize = require('sequelize');
    var kk = 0;
    const phoneValidity = (phone) => {

      if(phone.length > 0) {
        var phone = phone
                .replace(/ /g, '')
                .replace(/\-/g, '')
                .replace(/\./g, '')
                .replace(/\,/g, '')
                .replace(/\+/g, '')
                .replace(/\=/g, '');
  
        if ((phone.length == 10) && (phone.substr(0, 1) != '0')) phone = '0' + phone;
        else if ((phone.length == 11) && (phone.substr(0, 1) == '0')) phone = phone;
        else if ((phone.length == 13) && (phone.substr(0, 3) == '234')) phone = '0' + phone.substr(-10);
        else if ((phone.length == 14) && (phone.substr(0, 4) == '2340')) phone = '0' + phone.substr(-10);
        else return [phone, 5];
  
        return [phone, 0];
      } else return [phone, 5];
    
    }

    let grps = await models.Group.findAll(
      /* {
        where: {
            userId: 25,
        }
      } */
    );

    grps.forEach(async grp => {
      try {
        let pp = await models.Contact.findAll({
          where: {
              groupId: grp.id,
          }
        })
        .catch(err => {
          console.log('1. ERROR: ' + JSON.stringify(err));
          
        });

        pp.forEach(async p => {
          let p_ = phoneValidity(p.phone);
          await models.Contact.update(
            {
              phone: p_[0],
              status: p_[1] === 0 ? Sequelize.literal('status') : p_[1],
            },
            {
              where: {
                  id: p.id,
              }
            }
          )
          .catch(async err => {
            if(err.name === 'SequelizeUniqueConstraintError') {
              console.log('2. ERROR: ' + p.id + '-' + p.phone + '-' + 'DUPLICATE - ' + kk);
              console.log('KK = ' + kk);
              kk++;
              await models.Contact.destroy(
                {
                  where: {
                    id: p.id
                  }
                }
              )
              .then(() => {
                console.log('DELETED : ' + p.id);

              })
              .catch(err => {
                console.log('UNDELETED + ' + JSON.stringify(err));
                
              })
              
            }
            if(err.name === 'SequelizeConnectionAcquireTimeoutError') {
              console.log('3. ERROR: ' + p.id + '-' + p.phone + '-' + 'TIMEOUT!!! - ' + kk);

            }
            
          });
        });
        console.log('************* GROUP ' + grp.id + ' **************');
      } catch(err) {
          console.log('ERROR:  *** ' + err.errors[0].type); //JSON.stringify(err));//SequelizeConnectionAcquireTimeoutError//
        
      }
    });

    
    /* await models.Contact.update(
      {
        phone: phoneval(Sequelize.literal('phone')),
        status: 5,
      },
      {
        where: {
            userId: 25,
        }
      }
    ) */

    res.send('DONE!!!!');


    //  THE END!
  });

  //  GET page to enter parameters for load test
  app.get('/rundefaultgroups/tiwex', async (req, res) => {
    var mongmodels = require('../models/_mongomodels');
    
    console.log('ADJUSTMENT-SYNCHING STARTED..........');
    
    let users = await models.User.findAll({
      attributes: ['id'],
    })

    for(let u = 0; u < users.length; u++) {
      console.log('....................')
      let exists = await mongmodels.Group.find({
        userId: users[u].id,
        name: '[Uncategorized]'
      })
      if(!exists || exists.length === 0) {
        console.log('Creating Group for User #' + users[u].id);
        await mongmodels.Group.create({
          name: '[Uncategorized]',
          description: 'For all contacts without distinct groups.',
          userId: users[u].id,
          can_optin: false,
        })
      }
    }

    res.send('DATABASES ADJUSTMENT-SYNCHING DONE!!! BYE-BYE!!!');
  });

  //  GET page to enter parameters for load test
  app.get('/runloadtest/tiwex', async (req, res) => {

    var flashtype, flash = req.flash('error');
    if(flash.length > 0) { 
      console.log('111111111');
      flashtype = "error";           
    } else {
      flashtype = "success";
      flash = req.flash('success');
      console.log('222222222' + flash);
    }

    res.render('pages/_load_test_page_', {
      page: 'TRACKSEND LOAD TEST',
      flashtype, flash,

    });
  });
  //  start load test based on POSTed parameters
  app.post('/runloadtest/tiwex', async (req, res) => {

    const sendCampaign        = require('../my_modules/_loadtest/_loadtest_campaignsending');
    
    const num_of_contacts = req.body.contactscount;
    const concurrent_activities = req.body.concurrencycount;
    const sms_service = req.body.sms_service;
    const message = req.body.messager;
    const networktimeout = req.body.networktimeout;

    const user_id = 10;
    const sender = 42;
    const contacts = [];
    // const shorturl = null;
    // const url = null;

    // var _status;

    // req.externalapi = false;
    // req.txnmessaging = false;
    // req.loadtesting = true;

    console.log('received body: ' + JSON.stringify(req.body));
    req.networktimeout = { networktimeout };
    req.sms_service = sms_service;

    try {

      req.user = { id : user_id };

      console.log('LOADTEST INITIALIZED...');

      for(let k = 1; k <= num_of_contacts; k++) {
        contacts.push({
          phone:        "0" + (8000000000 + k),
          email:        "Mai" + k,
          country:      { id: 234 },
          fullname:     "Fullname-" + k,
          company:      "Company-" + k,
          city:         "City-" + k,
          state:        "State-" + k,
          zip_code:     "Zip-Code-" + k,
          count:        0,
          trip:         "Trip-" + k,
          rank:         "Rank-" + k,
          loyalty:      "Loyalty-" + k,
          category:     "Category-" + k,
        })
      }

      console.log('LOADTEST CONTACTS LOADED...');

      req.body.analysis_id = [4];
      req.body.type = 'sms';
      req.body.info = {
        total_cost: '',
        message,
        // schedule: '',
        // add_optout: false,
        // add_optin: false,
        name: 'LoadTest-' + new Date().toLocaleDateString(),
        description: 'Performing some load test on ' + new Date().toISOString(),
        senderId: sender,
        // shortlinkId: '',
        // recipients: '',
        // has_utm: false,
        grp: '',
        contacts,
        // within_days: '',
        // skip_dnd: false,
        // to_optin: '',
        // to_awoptin: '',
        // to_awoptin: '',
      };

      // let concurrencies = [];
      for(let i = 0; i < concurrent_activities; i++) {
        // concurrencies.push(await Promise.resolve(sendCampaign.bind(null, req, res)));
        console.log('============= ITERATION #' + (i + 1));
        sendCampaign(req, res);
      }

      // let ww = await Promise.all(concurrencies);


    } catch(err) {
        console.log('ERROR WA: ' + JSON.stringify(err));

        switch(err) {
            case 'auth':
                _status = {
                    response: "Error: You're not logged in.", 
                    responseType: "ERROR", 
                    responseCode: "E001", 
                    responseText: "Invalid Token", 
                };
                break;
            case 'balance':
                _status = {
                    response: "Error: Inadequate balance.", 
                    responseType: "ERROR", 
                    responseCode: "E002", 
                    responseText: "Inadequate balance", 
                };
                break;
            case 'fields':
                _status = {
                    response: "Error: Incomplete fields.", 
                    responseType: "ERROR", 
                    responseCode: "E003", 
                    responseText: "Check the fields for valid entries: 'name'; 'message'; 'sender'; 'group'.", 
                };
                break;
            case 'group':
                _status = {
                    response: "Error: Invalid Group Name.", 
                    responseType: "ERROR", 
                    responseCode: "E053", 
                    responseText: "Invalid Group Name.", 
                };
                break;
            case 'contacts':
                _status = {
                    response: "Error: Invalid Contacts (must be an array).", 
                    responseType: "ERROR", 
                    responseCode: "E052", 
                    responseText: "Invalid Contacts.", 
                };
                break;
            case 'message':
                _status = {
                    response: "Error: Invalid Message text (must not be empty).", 
                    responseType: "ERROR", 
                    responseCode: "E054", 
                    responseText: "Invalid Message.", 
                };
                break;
            case 'sender':
                _status = {
                    response: "Error: Invalid Sender ID Name.", 
                    responseType: "ERROR", 
                    responseCode: "E043", 
                    responseText: "Invalid Sender ID Name.", 
                };
                break;
            case 'shorturl':
                _status = {
                    response: "Error: Can't create shorturl.", 
                    responseType: "ERROR", 
                    responseCode: "E033", 
                    responseText: "There was an error creating the shorturl.", 
                };
                break;
            default:
                _status = {
                    response: "Error: General Error!" + err, 
                    responseType: "ERROR", 
                    responseCode: "E000", 
                    responseText: "General error. Please contact Tracksend admin.", 
                };
        }
        // return;
    }
  
    /* res.render('pages/_load_test_page_', {
      page: 'TRACKSEND LOAD TEST',
      output: 'done'
    }); */

    //  THE END!
  });






  app.get('/account/update/forgotpassword', async (req, res) => {

    /* var flashtype, flash = req.flash('error');
    if(flash.length > 0) { 
        flashtype = "error";           
    } else {
        flashtype = "success";
        flash = req.flash('success');
    } */

    res.render('pages/forgotpassword', {
      layout: 'main',
      page: 'Password Reset',
      flash: {
        type: req.flash('type'),
        msg: req.flash('msg'),
      },

      args: {
        show_input: true,
      }
    });

  });

  app.post('/account/update/forgotpassword', async (req, res) => {

    const scheduler = require('node-schedule');

    var mgauth = require('../config/cfg/mailgun')();
    const mailgun = require('mailgun-js')({apiKey: mgauth.APIKEY, domain: mgauth.DOMAIN});

    let dur = 60 * 60 * 1000; //  1 hour
    let show_input = true;


    try {
      let usr = await models.User.findOne(
        {
          where: {
            email: req.body.email,
          }
        }
      )

      if(usr) {
        //  return error

        let token = await randgen('token', models.User, 'mysql', 64, 'fullalphnum');
        usr.update({
          token
        })

        try {
          /* var transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'rahsaan.hilll@ethereal.email', // generated ethereal user
                pass: 'fts9U7Q2Q8QUbvrdxw' // generated ethereal password
            },
            //  remove this if you're using a real SMTP service...
            tls: {
              rejectUnauthorized: false
            }
          })

          // send mail with defined transport object
          var info = await transporter.sendMail({
            from: '"Tracksend" <info@tracksend.com>', // sender address
            to: '"' + usr.name + '" <' + usr.email + '>', // list of receivers
            subject: 'Hallo ✔', // Subject line
            text: 'Hello ' + usr.name + ', <br><br>You have indicated that you\'ve forgotten your Tracksend password, and therefore requested a password reset. If you wish to carry on with this, kindly follow the link: https://dev2.tracksend.co/account/update/password/' + usr.email + '/' + token + '; else please ignore this mail. The provided link would be invalid after one hour. Thanks.', // plain text body
            html: '<b>Hello ' + usr.name + '</b>, <br><br>You have indicated that you\'ve forgotten your Tracksend password, and therefore requested a password reset. If you wish to carry on with this, kindly follow the link: https://dev2.tracksend.co/account/update/password/' + usr.email + '/' + token + '; else please ignore this mail. The provided link would be invalid after one hour.<br><br><br> Thanks,<br>Tracksend.', // html body
          }); */

          /* mg.sendText('Tracksend <info@tracksend.com>',   //  sender
            [ usr.name + ' <' + usr.email + '>'],         //  [recipient(s)]
            'Password Reset Link',                        //  subject
            'Hello ' + usr.name + ', <br><br>You have indicated that you\'ve forgotten your Tracksend password,    ' +
            'and therefore requested a password reset. If you wish to carry on with this, kindly follow the link:  ' + 
            'https://dev2.tracksend.co/account/update/password/' + usr.email + '/' + token + '; else please ignore ' +
            'this mail. The provided link would be invalid after one hour. Thanks.',                           //  content
            // 'noreply@example.com', {},
            function(err) {
              if (err) console.log('Error! Error!!: ' + err);
              else     console.log('Success');
            }
          ); */


          var data = {
            from: 'Tracksend <info@tracksend.co>',
            // to: usr.name + ' <' + usr.email + '>',
            to: usr.email,
            subject: 'Password Reset Link',
            text: 'Hello ' + usr.name + ', <br><br>You have indicated that you\'ve forgotten your Tracksend password,    ' +
            'and therefore requested a password reset. If you wish to carry on with this, kindly follow the link:  ' + 
            env.SERVER_BASE + '/account/update/password/' + usr.email + '/' + token + '; else please ignore ' +
            'this mail. The provided link would be invalid after one hour. Thanks.',
          };
           
          mailgun.messages().send(data, function (error, body) {
            console.log('error: ' + JSON.stringify(error));
            console.log('body: ' + JSON.stringify(body));
          });

        } catch(e) {
          console.log('====================================');
          console.log('Mailing error: ' + e);
          console.log('====================================');
          throw('MAIL ERROR');
        }
      
        //  set scheduler to delete token after one hour
        var date = Date.now() + dur;
        
        scheduler.scheduleJob(date, () => {
          usr.update({
            token: ''
          })
        });

        req.flash('type', 'success');
        req.flash('msg', 'A password reset link has been sent to your email.');

        show_input = false;
        // return res.redirect('/dashboard/profile');
      } else {
        req.flash('type', 'error');
        req.flash('msg', 'Sorry, the email address you provided does not belong to a registered account. Kindly check again.');

        show_input = true;
      }
    } catch(e) {
      console.log('====================================');
      console.log('ERROR: ' + e);
      console.log('====================================');

      req.flash('type', 'error');
      req.flash('msg', 'Sorry, an error occurred. Kindly contact site admin or try again later.');

      show_input = true;
    }

    res.render('pages/forgotpassword', {
      layout: 'main',
      page: 'Password Reset',
      flash: {
        type: req.flash('type'),
        msg: req.flash('msg'),
      },

      args: {
        show_input,
      }
    });

  });

  app.get('/account/update/password/:email/:token', async (req, res) => {

    var email = req.params.email;
    var token = req.params.token;

    console.log('Email = ' + email + "; token = " + token);
    
    res.render('pages/passwordupgrade', {
      layout: 'main1',
      page: 'LOGIN',
      args: {
          email,
          token,
      }
    });

  });


  app.post('/account/update/password/', async (req, res) => {

    var email = req.body.email; 
    var token = req.body.token;
    var password = req.body.password;
    var cpassword = req.body.confirm_password;

    console.log('hehe');

    if(password == cpassword) {
      
      models.User.findAll({
        where: {
          email,
          token,
          update_profile: 0
        }
      })
      .then(async usr => {
        console.log('====================================');
        console.log('user = ' + JSON.stringify(usr));
        console.log('====================================');

        if(!usr.length || usr.length > 1) {
          res.send('INVALID OPERTAION!');
        } else {

          var user = await models.User.findByPk(usr[0].id);
          if(!user) {
            console.log('====================================');
            console.log('user error!');
            console.log('====================================');
            return;
          }

          var new_password = bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);

          await user.update({
              password: new_password,
              token: null,
              update_profile: 1
          })

          console.log('UPDATED');
          req.login(user, function(err) {
              if (err) { 
                  return next(err); 
              }
              req.flash('success', 'Password update successfully');
              return res.redirect('/dashboard/profile');
          });

        }
      })
      .error((err) => {
        console.log('====================================');
        console.log('error = ' + err);
        console.log('====================================');
      })

    } else {
        req.flash('error', 'Password mismatch. Please enter again.');
        res.redirect('/dashboard/profile');
    }

  });

  app.get('/login', (req, res) => {
    if(req.user) {
      res.redirect('/dashboard');
      return;
    }
    
    res.render('pages/login', {
      layout: 'main',
      page: 'LOGIN',
      auth: (req.user) ? true : false,
      flash: {
        type: req.flash('type'),
        msg: req.flash('msg'),
      },
    })
  });

  app.get('/register', (req, res) => {
    if(req.user) {
      res.redirect('/dashboard');
      return;
    }

    res.render('pages/register', {
      layout: 'main',
      page: 'REGISTER',
      auth: (req.user) ? true : false,
      flash: {
        type: req.flash('type'),
        msg: req.flash('msg'),
      },
    })
  });

  app.get("/logout", function(req, res) {
    req.logout();
    
    req.flash('type', 'success');
    req.flash('msg', _message('msg', 1020, 234));
    // req.flash('msg', _message`$(msg)$(1020)$(234)`);
    res.redirect("/");
  });

  app.use('/redirect', redirectRouter);

  app.get('/optin/:optid', msgOptinController.postOptin);   //  deprecated. Should go through redirect route
  app.use('/messages', msgRouter);
  app.use('/sms', smsRouter);
  app.use('/WhatsApp', whatsAppRouter);

};


// module.exports = router;
