var express = require('express');
var router = express.Router();
var models = require('../models');
var _message = require('../my_modules/output_messages');
var whatsappController = require('../controllers/WhatsAppController');

// Home page route.
// router.get('/optin', whatsappController.optin);

router.get('/optout/:kid', async(req, res) => {

  const randgen = require('../my_modules/randgen');
  var phoneval = require('../my_modules/phonevalidate');
  var phoneformat = require('../my_modules/phoneformat');

  //  for the sake of it, the only useful part of the 'clientid' is the third part of it... which is the client's userId
  let kid = req.params.kid;

  console.log('[[====================================');
  console.log('OPT-OUT DATA: ...' + kid);
  console.log('====================================]]');

  try {
      //  get user details
      let kont = await models.Contact.findByPk(kid, {
          include: [{
              model: models.User, 
              attributes: ['name', 'business']
          },{
              model: models.Group, 
              attributes: ['name']
          }],
      });

      if(!kont) throw {
          name: 'requesterror',
      };
      console.log('====================================');
      console.log('KONT DATA: ' + JSON.stringify(kont));
      console.log('====================================');
      let ctry = await models.Country.findAll({ 
          order: [ 
              ['name', 'ASC']
          ]
      })

      var flashtype, flash = req.flash('error');
      if(flash.length > 0) {
          flashtype = "error";           
      } else {
          flashtype = "success";
          flash = req.flash('success');
      }

    res.render('pages/smscompleteoptout', {
        layout: 'dashboard_blank',
        title: kont.user.business,
        _page: 'SMS Opt-Out',
        flashtype, flash,

        args: {
            ctry,
            kid,
        //   groupname: kont.group.name,
        //   username: kont.user.name,
        //   business: kont.user.business,
            _msg: _message('msg', 1090, kont.countryId, kont.user.business, kont.group.name),
        }
    });
  
  
    } catch(e) {
        console.log('====================================');
        console.log('error: ' + e.name);
        console.log('error: ' + JSON.stringify(e));
        console.log('error: ' + e);
        console.log('====================================');
        res.render('pages/redirect-error', {
            layout: 'dashboard_blank',
            title: 'Error',
            page: '',

        });
    }

});

router.post('/optout', async(req, res) => {

  const randgen = require('../my_modules/randgen');
  var phoneval = require('../my_modules/phonevalidate');
  var phoneformat = require('../my_modules/phoneformat');

  //  for the sake of it, the only useful part of the 'clientid' is the third part of it... which is the client's userId
  
  try {
      //  get user details
      if(!(req.body.phone = phoneval(req.body.phone, req.body.country))) throw {
          name: 'phoneerror',
      };

      let kid = req.body.code;
      let phone = req.body.phone;
      let ctry = req.body.country;

      console.log('[[====================================');
      console.log('KID: ...' + kid + '; PHONE = ' + phone + '; CTRY' + ctry);
      console.log('====================================]]');

      let kont = await models.Contact.findByPk(kid);

      if(!kont || (kont.phone != phone)) throw {
          name: 'invalidoperation',
      } 

      if(kont.do_sms != 1) throw {
          name: 'notsubscribed',
      } 
      

      await kont.update({
          do_sms: 2
      });

      console.log('====================================');
      console.log('whatsapp status changed: result = ' + JSON.stringify(kont));
      console.log('====================================');

      //  register opt-out
      await models.Optout.create({
          contactId: kid,
          userId: kont.userId,
          platform: 'SMS',
      })

        res.render('pages/smscompleteoptout', {
            layout: 'dashboard_blank',
            title: 'Thanks',
            _page: 'SMS Opt-Out',

            args: {
                _msg: _message('msg', 1080, req.body.country)
            }
        });

    } catch(e) {
        console.log('====================================');
        console.log('erroooooooooooooer: ' + JSON.stringify(e));
        console.log('====================================');
        let errmsg;
        if(e.name == 'SequelizeUniqueConstraintError') {
            errmsg = _message('error', 1010, req.body.country);
        }
        else if(e.name == 'invalidoperation') {
        errmsg = _message('error', 1080, req.body.country);
        }
        else if(e.name == 'phoneerror') {
            errmsg = _message('error', 1070, req.body.country);
        }
        else if(e.name == 'notsubscribed') {
            errmsg = _message('error', 1090, req.body.country);
        }

        req.flash('error', errmsg);
        var backURL = req.header('Referer') || '/';
        res.redirect(backURL);

        /* res.render('pages/dashboard/whatsappcompleteoptout', {
            _page: 'WhatsApp Opt-Out',

            args: {
                error: errmsg
            }
        }); */

    }

});

/* router.get('/optin/:kid', async(req, res) => {

    const randgen = require('../my_modules/randgen');
    var phoneval = require('../my_modules/phonevalidate');
    var phoneformat = require('../my_modules/phoneformat');

    //  for the sake of it, the only useful part of the 'clientid' is the third part of it... which is the client's userId
    let kid = req.params.kid;

    console.log('[[====================================');
    console.log('OPT-OUT DATA: ...' + kid);
    console.log('====================================]]');

    try {
        //  get user details
        let kont = await models.Contact.findByPk(kid, {
            include: [{
                model: models.User, 
                attributes: ['name', 'business']
            },{
                model: models.Group, 
                attributes: ['name']
            }],
        });
        console.log('q= ' + JSON.stringify(kont.user.business));
        
        if(!kont) {
            throw {
                name: 'requesterror',
            }
        } else {
            await kont.update({
                do_sms: 1
            })
        }

        res.render('pages/dashboard/whatsappcompleteoptin', {
            layout: 'dashboard_blank',
            title: kont.user.business,
            _page: 'SMS Opt-In',

            args: {
                _msg: _message('msg', 1081, kont.countryId),
            }
        });
  
  
    } catch(e) {
        console.log('====================================');
        console.log('error: ' + e.name);
        console.log('error: ' + JSON.stringify(e));
        console.log('error: ' + e);
        console.log('====================================');
        res.render('pages/redirect-error', {
            layout: 'dashboard_blank',
            title: 'Error',
            page: '',

        });
    }

}); */
router.get('/optin/:kid', whatsappController.postOptin);    //  controller should be reworded/rejigged 

router.post('/optin', async(req, res) => {

  const randgen = require('../my_modules/randgen');
  var phoneval = require('../my_modules/phonevalidate');
  var phoneformat = require('../my_modules/phoneformat');

  //  for the sake of it, the only useful part of the 'clientid' is the third part of it... which is the client's userId
  
  try {
      //  get user details
      if(!(req.body.phone = phoneval(req.body.phone, req.body.country))) throw {
          name: 'phoneerror',
      };

      let kid = req.body.code;
      let phone = req.body.phone;
      let ctry = req.body.country;

      console.log('[[====================================');
      console.log('KID: ...' + kid + '; PHONE = ' + phone + '; CTRY' + ctry);
      console.log('====================================]]');

      let kont = await models.Contact.findByPk(kid);

      if(!kont || (kont.phone != phone)) throw {
          name: 'invalidoperation',
      } 

      if(kont.do_sms != 1) throw {
          name: 'notsubscribed',
      } 

      await kont.update({
          do_sms: 2
      });

      console.log('====================================');
      console.log('whatsapp status changed: result = ' + JSON.stringify(kont));
      console.log('====================================');

      //  register opt-out
      await models.Optout.create({
          contactId: kid,
          userId: kont.userId,
          platform: 'SMS',
      })

        res.render('pages/smscompleteoptout', {
            layout: 'dashboard_blank',
            title: 'Thanks',
            _page: 'SMS Opt-Out',

            args: {
                _msg: _message('msg', 1080, req.body.country)
            }
        });

    } catch(e) {
        console.log('====================================');
        console.log('erroooooooooooooer: ' + JSON.stringify(e));
        console.log('====================================');
        let errmsg;
        if(e.name == 'SequelizeUniqueConstraintError') {
            errmsg = _message('error', 1010, req.body.country);
        }
        else if(e.name == 'invalidoperation') {
        errmsg = _message('error', 1080, req.body.country);
        }
        else if(e.name == 'phoneerror') {
            errmsg = _message('error', 1070, req.body.country);
        }
        else if(e.name == 'notsubscribed') {
            errmsg = _message('error', 1090, req.body.country);
        }

        req.flash('error', errmsg);
        var backURL = req.header('Referer') || '/';
        res.redirect(backURL);

        /* res.render('pages/dashboard/whatsappcompleteoptout', {
            _page: 'WhatsApp Opt-Out',

            args: {
                error: errmsg
            }
        }); */

    }

});

module.exports = router;