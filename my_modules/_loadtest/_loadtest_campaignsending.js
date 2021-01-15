/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/
const _  = require('lodash');
var models = require('../../models');
const kirusa = require('./platforms/kirusa');
const infobip = require('./platforms/infobip');
const messagebird = require('./platforms/messagebird');
const africastalking = require('./platforms/africastalking');

const sendCampaign = async (req, res) => {
  console.log('1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\');
  if(req.externalapi) console.log('1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\');
  
  var aux_obj = {};
  try {
      var user_id = req.user.id;
      var is_api_access = false;
      // var user_id = 10;
  } catch {
      let _id;
      if(_id = await apiAuthToken(req.body.token)) {
          req.user = {id : _id};
          var user_id = req.user.id;
          var is_api_access = true;

          let sms_service = await models.User.findByPk(user_id, {
              attributes: ['sms_service'],
          })
          console.log('%%%%%%%%%%%%%%%%%sms_service='+JSON.stringify(sms_service));
          
          aux_obj = {
              sms_service: sms_service.sms_service,
          };
      } else return;
  }

  var tempid = req.body.analysis_id;
  var ctype = req.body.type;
  console.log('====================================');
  console.log('CAMPAIGN OPS: ' + (Array.isArray(tempid) ? 'yes' : 'no') + ' ; ' + tempid + "tempid.length="+tempid.length);
  console.log('====================================');

  if(!Array.isArray(tempid)) {
      tempid = [tempid]
      ctype = [ctype]
  }

  for(var ii = 0; ii < tempid.length; ii++) {
    //  RETRIEVE CAMPAIGN DETAILS FROM TEMPORARY TABLE 
    console.log(ii + " - RETRIEVE CAMPAIGN DETAILS FROM TEMPORARY TABLE____________________________________________________") 
    if(is_api_access && tempid[0] == 'api') {
        var info = req.body.info; ii = tempid.length;
    } else {
        console.log("______________________________________________TMPTABLE____________________________________________________") 
        var info = req.body.info;
    }

    if(ctype[ii] == "whatsapp") {
        // doWhatsApp();
    } else if(info) {
        console.log("______________________________________________info____________________________________________________") 
        if(info.ref_campaign) {
            console.log("______________________________________________ref_campaign____________________________________________________") 
            let ref = info.ref_campaign;
            let schedule = info.schedule;
            let within_days = info.within_days;

            console.log('====================================');
            console.log('|||||||||||||||||| dataa = '+ ii + ' - ');
            console.log('====================================');

            if(!schedule || schedule === 'null') {
                let ts = moment().add(parseInt(within_days), 'days');
                // let ts = moment().add(parseInt(within_days), 'hours');
                // let ts = moment().add(parseInt(within_days), 'minutes');
                console.log('====================================');
                console.log('date 2a='+ts);
                console.log('====================================');
                var date = new Date(ts);
                console.log('====================================');
                console.log('date 3a=' + JSON.stringify(ts));
                console.log('====================================');
            } else {
                console.log('====================================');
                console.log('date 1b='+schedule);
                console.log('====================================');
                let ts = moment(schedule, 'YYYY-MM-DD HH:mm:ss').add(parseInt(within_days), 'days');
                // let ts = moment(schedule, 'YYYY-MM-DD HH:mm:ss').add(parseInt(within_days), 'hours');
                // let ts = moment(schedule, 'YYYY-MM-DD HH:mm:ss').add(parseInt(within_days), 'minutes');
                console.log('====================================');
                console.log('date 2b='+ts);
                console.log('====================================');
                var date = new Date(ts);
                console.log('====================================');
                console.log('date 3b=' + JSON.stringify(ts));
                console.log('====================================');
            }

            scheduler.scheduleJob(date, function(reff) {
                console.log('_________reff=' + reff + '___________');
                
                doSMS(info, reff)
            }.bind(null, info.id)) 
            
            /* _dosms.bind(info.id));
            function _dosms(reff) {
            } */
        } else {
            let resp = await doSMS(info, null);                                                                                                                                                           
            console.log('2++++++++++'+ JSON.stringify(resp));
            if(is_api_access && tempid[0] == 'api') return resp;
            else {
                if(( resp && resp.responseType && (resp.responseType == "ERROR")) || (resp && resp.status && (resp.status == 'error'))) {
                    req.flash('error', 'An error occured. Please try again later or contact site admin.');
                } else {
                    let _msgmsg = (info.schedule == 'Invalid date') ? 'Messages sent out' : 'Messages would be sent out at ' + info.schedulewa;
                    req.flash('success', 'Campaign created successfully. ' + _msgmsg);
                }
                //   don't return or 'res.send' yet cos this is in a loop
            }
        }
    } else {
        console.log('INVALID OPERATION!');
    }
  }

  async function doSMS(info, ref) {
      //  ...continues here if type-sms and has been analysed 
      
      // get real ref
      var nref = null;
      
    //   console.log('form details are now...' + JSON.stringify(info)); 
      if(ref) {
          info = await models.Tmpcampaign.findByPk(ref);
          nref = info.ref_campaign;
          console.log('_____________________ THIS IS REF =' + JSON.stringify(nref) + '_____________________ THIS IS rrREF =' + JSON.stringify(info.ref_campaign));
      }

      //  GET USER BALANCE
      let user_balance_ = await models.User.findByPk(user_id, {
          attributes: ['balance'], 
          raw: true, 
      })
      var user_balance = user_balance_.balance;
      console.log('USER BALANCE IS ' + JSON.stringify(user_balance));
      
      if(!ref && (user_balance < info.cost)) {
          console.log('INSUFFICIENT BALANCE!');

          return;
      }

      var originalmessage  = info.message.replace(/[^\x00-\x7F]/g, "");
      
      var schedule_ = (info.schedule && !ref) ? moment(info.schedule, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') : null;  //  for DB
      var schedule  = (info.schedule && !ref) ? moment(info.schedule, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.000Z') : null;   //  for infobip

      var UNSUBMSG = false;
      if(info.add_optout) {
          UNSUBMSG = true; //_message('msg', 1091, ) '\n\nTo unsubscribe, click: https://dev2.tracksend.co/sms/optout/';
      }
      var DOSUBMSG = false;
      if(info.add_optin) {
          DOSUBMSG = true; //_message('msg', 1091, ) '\n\nTo unsubscribe, click: https://dev2.tracksend.co/sms/optout/';
      }

      
      //  create campaign
      let prom = await Promise.all([
          models.Campaign.create({
              name: info.name,
              description: info.description,
              userId: 'user_id',
              senderId: ['info.senderId'],
              shortlinkId: 'info.shortlinkId',
              message: originalmessage,
              schedule: schedule_,
              recipients: info.recipients,
              has_utm: info.has_utm,
              condition: info.grp,
              within_days: info.within_days,
              ref_campaign: nref,
          }).catch((err) => {
            console.log('Campaign.create FakeERROR: ' + err);
            return { id: 101 }
          }),
          models.Sender.findByPk(info.senderId)
      ])
      .then(async ([cpn, sndr]) => {
          //  bind campaign to group(s)   //  group | dnd | myshorturl
          // var group = info.grp;
          
          var HAS_SURL = false;
          // console.log('info.grp = ' + info.grp + 'ppp-info.grp = ' + JSON.stringify(info.grp) + '______ref = ' + ref);
          // console.log((info.grp != 0 && !Array.isArray(info.grp)) ? "NON-ARRAY" : "ARRAY");

          var groups
          /* if ((info.grp === "clicked") || (info.grp === "unclicked") || (info.grp === "elapsed")) {
              groups = [info.grp]; 
          } else {
              let groups_ = JSON.parse(info.grp);//
              groups = groups_.map(g => {
                  return mongoose.Types.ObjectId(g);
              })
          } */
          
          // console.log('______________________info.group = ' + groups + '; json = ' + JSON.stringify(groups));
          var skip = (info.skip_dnd && info.skip_dnd == "on");
          var unsub     = info.add_optout;
          var dosub     = info.add_optin;
          var tooptin   = info.to_optin;
          var toawoptin = info.to_awoptin;
          var toall     = tooptin && toawoptin;
          console.log('===========================');
          console.log('tooptin='+tooptin+'; toawoptin='+toawoptin+'; toall='+toall);
          console.log('===========================');
          
          var contacts, arr;         
          if(1) {

            console.log('CONTACTS ARE: ' + info.contacts.length);
                contacts = _.uniqBy(info.contacts, 'phone');
              /*  */

              //  change status of shortlink to used
              if (info.shortlinkId) {
                  HAS_SURL = true;
                  /* await models.Shortlink.findByPk(info.shortlinkId)
                  .then((shrt) => {
                      shrt.update({
                          shorturl: info.myshorturl,
                          status: 1
                      })
                  })
                  .error((err) => {
                      console.log('2BIG ERROR: ' + err);
                  }) */
              }
              
              //  check for personalizations
              var SINGLE_MSG = false;
              var chk_message = originalmessage
                  .replace(/\[firstname\]/g,  'X')
                  .replace(/\[first name\]/g, 'X')
                  .replace(/\[lastname\]/g,   'X')
                  .replace(/\[last name\]/g,  'X')
                  .replace(/\[email\]/g,      'X')
                  .replace(/\[e-mail\]/g,     'X')
                  .replace(/\[phone\]/g,      'X')
                  .replace(/\[zip-code\]/g,   'X')
                  .replace(/\[zip code\]/g,   'X')
                  .replace(/\[zip_code\]/g,   'X')
                  .replace(/\[zipcode\]/g,    'X')
                  .replace(/\[url\]/g,        'X')

                  .replace(/\[loyalty\]/g,    'X')
                  .replace(/\[rank\]/g,       'X')
                  .replace(/\[company\]/g,    'X')
                  .replace(/\[city\]/g,       'X')
                  .replace(/\[state\]/g,      'X')
                  .replace(/\[count\]/g,      'X')
                  .replace(/\[trip\]/g,       'X')
                  .replace(/\[category\]/g,   'X')
                  .replace(/\[createdat\]/g,  'X');
              

              if(chk_message == originalmessage) {
                  SINGLE_MSG = true;
              }






                /* let resp = await smsSendEngines... */
                
                var file_not_logged = true;
                SINGLE_MSG = SINGLE_MSG && !UNSUBMSG && !DOSUBMSG;    //  UNSUBMSG includes individual contact ids so invariable can't be single msg
                var sms_service;        
                console.log('001~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~');
                if(req.externalapi) console.log('2~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~');
                
                try {
                    
                    sms_service = req.sms_service;

                    console.log('001~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~sms_service = ', sms_service);
            
                    if(sms_service == 'kirusa') {
                        console.log('0011~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~');
                        let resp = await kirusa.kirusaPlatform(req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
                                              originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj);
            
                        console.log('returned: 0011~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~', JSON.stringify(resp));
                        return resp;
                    }
            
                    if(sms_service == 'infobip') {
                        let resp = await infobip.infobipPlatform(req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
                                                originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj);
                        return resp;
                    }
            
                    if(sms_service == 'messagebird') {
                        let resp = await messagebird.messagebirdPlatform(req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
                                                        originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj);
                        return resp;
                    }
            
                    if(sms_service == 'africastalking') {
                        let resp = await africastalking.africastalkingPlatform(req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
                                                              originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj);
                        return resp;
                    }
            
                } catch(err) {
                    console.log('%%%%%%%%%%%'+err);
                    
                    return { status: "error", msg: err };
                }
                
                /* let resp = await smsSendEngines... */
                





              console.log('++++++++++++++++++++');
              console.log(resp);
              return resp;

          } else {
              return {
                  response: "Error", 
                  responseType: "ERROR", 
                  responseCode: "E000", 
                  responseText: "An error occured.", 
              }
          }

      })
      /* .catch((err) => {
          console.error('BIG BIG ERROR: ' + err);
      }) */

      return prom;
  }	

  async function doWhatsApp() {
      var API = require('../../config/cfg/chatapi')();
      const { default: axios } = require('axios');
      var qs = require('qs');
      var whatsappSendMessage = require('../whatsappSendMessage');
      
      try {
          var sendmethod = parseInt(req.body.wa_send_method);

          console.log('====================================');
          console.log('ALL SENT = ' + JSON.stringify(req.body));
          if(req.files && req.files.att_file) console.log('FILE? = ' + JSON.stringify(Object.keys(req.files.att_file)));
          console.log('====================================');
          //  create campaign
          var cpn = await models.Campaign.create({
              name: req.body.name,
              description: req.body.description,
              userId: user_id,
              senderId: req.body.senderId,
              shortlinkId: req.body.shorturl,
              message: req.body.message,
              schedule: (req.body.datepicker) ? req.body.schedule : null, //req.body.schedule,
              recipients: req.body.recipients,
              has_utm: (req.body.add_utm && req.body.add_utm == "on") ? 1 : 0,
              platformtypeId: 2, //  '2' for whatsapp
          });
          
          var HAS_SURL = (!req.body.shorturl || req.body.shorturl == '0') ? false : true;
          
          var groups = req.body.group;
          if (groups != 0 && !Array.isArray(groups)) groups = [groups];
          
          // console.log('req.body.group = ' + groups + '; json = ' + JSON.stringify(groups));

          if (groups == 0) throw "1001";
          let ggs_ = groups.map(g => {
              return mongoose.Types.ObjectId(g);
          })
          var everything = [];
          var k = 0;

          if (sendmethod === 1) {
              var dd = await mongmodels.Group.aggregate([
                  {
                      $match: {
                          _id: {
                              $in: ggs_,
                          },
                          userId: user_id,
                      }
                  }, {
                      $lookup: {
                          from: "contacts",
                          // localField: '_id', 
                          // foreignField: 'groupId',
                          as: 'contacts',
                          let: {
                              "group_id": "$_id"
                          },
                          pipeline: [
                              {
                                  $match: {
                                      userId:  user_id, 
                                      $expr: {
                                          $eq: [
                                              "$groupId", "$$group_id"
                                          ],
                                      },
                                      do_whatsapp: 1
                                  }
                              },
                          ]
                      }
                  }/* , {
                      $project: {
                          "contacts.createdAt": 0,
                          "contacts.updatedAt": 0,
                          "createdAt": 0,
                          "updatedAt": 0,
                      }
                  } */                        
              ])      //  consider adding .exec() for proper promise handling

              //  merge contacts from all groups...
              console.log('====================================');
              // console.log('GROUP OUTPUT = ' + JSON.stringify(dd));
              console.log('====================================');

              if(dd.length == 0) throw "1002";

              var arr = [];
              dd.forEach(async (el) => {
                  arr = arr.concat(el.contacts);

                  console.log('group kan...');
                  
                  await models.CampaignGroup.create({
                      campaignId: cpn.id.toString(),
                      groupId: el._id,
                  });
              });

              //  remove duplicates
              var contacts = _.uniqBy(arr, 'phone');

              console.log('start processing...');
              
              //  loop through all the batches
              for (let i = 0; i < contacts.length; i++) {
                  everything.push(await sendWhatsAppMessage(contacts[i]), "single");
              }
      
              //  finally redirect back to page
              console.log('END... NEW PAGE!');
          } else {
              for (let i = 0; i < groups.length; i++) {
                  console.log('====================================');
                  console.log('kontakt 2 is = ' + JSON.stringify(groups[i]));
                  console.log('====================================');
                  everything.push(await sendWhatsAppMessage(groups[i]), "group");
                  // await sendWhatsAppMessage(contacts[i]);
              }
          }

          Promise.all(everything)
          .then((data) => {
              console.log('====================================');
              console.log();
              console.log('====================================');
              let _msgmsg = (req.body.schedulewa == 'Invalid date') ? 'Messages sent out' : 'Messages would be sent out at ' + req.body.schedulewa;
              req.flash('success', 'Campaign created successfully. ' + _msgmsg);
              var backURL = req.header('Referer') || '/';
              res.redirect(backURL);

          })
          
      } catch(e) {
          console.error('====================================');
          console.error('ERROR OCCURRED: ' + e);
          console.error('====================================');

          await cpn.destroy();
          let emsg = 'Sorry an error occurred. Please try again or contact Admin.';

          if(e == '1001') emsg = 'No valid Group was selected. Please try again.';
          if(e == '1002') emsg = 'No WhatsApp Contact was selected. Kindly try again with appropriate Group(s)';
          // if(e == '1001') emsg = 'No WhatsApp Contact was selected. Kindly try again with appropriate Group(s)';

          req.flash('error', emsg); 
          var backURL = req.header('Referer') || '/';
          res.redirect(backURL);
      }

      async function sendWhatsAppMessage(kont, typ) {

          if(typ == "group") {
              console.log('====================================');
              console.log('GROOUUUPPPOOOOOOOOO');
              console.log('====================================');
              //  { SEND_GROUP_MESSAGES_TO_CHAT-API }
              return;

          }
          k++;
          console.log('*******   Aggregating Contact #' + k + ':...' + JSON.stringify(kont) + '   ********' + typ);
          
          // return new Promise(resolve => {

          //create contact codes
          var args = {};

          if(HAS_SURL) {
              console.log('GET UNIQUE ID!!!');
              
              args = await getUniqueId();

          } else {
              args = {
                  sid : null,
                  slk : null,
                  cid: null, 
              }
          }
          console.log('====================================');
          console.log('ARGS: ' + JSON.stringify(args));
          console.log('====================================');
          console.log('NEXT: Promise.all Done');
          
          return await send(args, kont);

          // })
      }

      async function getUniqueId() {

          do {

              var uid = makeId(3);
              var exists = await models.Message.findAll({
                  where: { 
                      campaignId: cpn.id.toString(),
                      contactlink: uid,
                  },
              })
              .error((r) => {
                  console.log("Error: Please try again later");
              })
                  // if(uid.length)
              
          } while (exists.length);
          console.log('UID = ' + uid);
          let shrtlnk = await models.Shortlink.findByPk(req.body.shorturl);
          return {
              sid : shrtlnk? shrtlnk.id : null,
              slk : shrtlnk? shrtlnk.shorturl: null,
              cid: uid, 
          };

      }
      
      async function send(args, kont) {
          let nmsg = await cpn.createMessage({
              shortlinkId: args.sid,
              contactlink: args.cid,
              contactId: kont._id,
              platformtypeId: 2,
              status: 0,
          })

          console.log('MESSAGE ENTRY CREATE STARTED.');
                                              
          let updatedmessage  = req.body.message
          .replace(/\[firstname\]/g,  kont.firstname)
          .replace(/\[first name\]/g, kont.firstname)
          .replace(/\[lastname\]/g,   kont.lastname)
          .replace(/\[last name\]/g,  kont.lastname)
          .replace(/\[email\]/g,      kont.email)
          .replace(/\[e-mail\]/g,     kont.email)
          .replace(/\[phone\]/g,      kont.phone)
          .replace(/\[zip-code\]/g,   kont.zip_code)
          .replace(/\[zip code\]/g,   kont.zip_code)
          .replace(/\[zip_code\]/g,   kont.zip_code)
          .replace(/\[zipcode\]/g,    kont.zip_code)

          .replace(/\[loyalty\]/g,    kont.loyalty)
          .replace(/\[rank\]/g,       kont.rank)
          .replace(/\[company\]/g,    kont.company)
          .replace(/\[city\]/g,       kont.city)
          .replace(/\[state\]/g,      kont.state)
          .replace(/\[count\]/g,      kont.count)
          .replace(/\[trip\]/g,       kont.trip)
          .replace(/\[category\]/g,   kont.category)
          .replace(/\[createdat\]/g,  kont.createdAt)
          
          .replace(/\[url\]/g, 'http://tsn.pub/' + args.slk + '/' + args.cid)
          .replace(/\s{2,}/g, '')
          // .replace(/\\r/g, '')
          // .replace(/\\n/g, '')
          // .replace(/\\t/g, '')
          .replace(/&nbsp;/g, ' ');

          //  { SEND_SINGLE_MESSAGES_TO_CHAT-API }
              console.log('1 kont = ' + JSON.stringify(kont));

          let tophone = phoneformat(kont.phone, kont.country.id);
          // console.log('====================================');
          // console.log(nmsg, tophone, updatedmessage, req.user.wa_instanceid, req.user.wa_instancetoken);
          // console.log('====================================');

          if(!req.files || Object.keys(req.files).length === 0) {
              // sendSingleMsg(nmsg, tophone, updatedmessage, req.user.wa_instanceurl, req.user.wa_instancetoken, kont.id, req.body.schedulewa);
              console.log('2 kont = ' + JSON.stringify(kont));
              
              await whatsappSendMessage('message', tophone, updatedmessage, req.user.wa_instanceid, req.user.wa_instancetoken, kont._id, nmsg.id, req.body.schedulewa);
          } else {

              let uploadedfile = await uploadMyFile(req.files.att_file, 'whatsapp');

              /* let ofile = req.files.att_file;
              let filename_ = ofile.name.split('.'); 
              let filename = filename_[0].substr(0, 20); 
              filename = ((filename_[0] > filename) ? filename.substr(0, 14) + '_trunc' : filename) + '.' + filename_[1];
              
              let tempfilename = await randgen('', '', 20, 'fullalphnum', '_');
              var timestamp_ = new Date();
              var timestamp = timestamp_.getTime();
              tempfilename += '_' + timestamp + '.' + filename_[1]; 

              await ofile.mv('tmp/whatsapp/'+tempfilename);  */
              
              // let nfile = await fs.readFileSync('tmp/whatsapp/'+tempfilename, { encoding: 'base64' });
              // nfile = 'data:' + ofile.mimetype + ';base64,' + nfile;
              // console.log('tepfile = ' + tempfilename + '; filenae = ' + filename + '; base64 = ' + nfile);
              
              let nfile = await fs.readFileSync(uploadedfile.filepath, { encoding: 'base64' });
              nfile = 'data:' + uploadedfile.mimetype + ';base64,' + nfile;
              // console.log('tepfile = ' + tempfilename + '; filenae = ' + filename + '; base64 = ' + nfile);
              // sendSingleFile(nmsg, tophone, nfile, req.user.wa_instanceurl, req.user.wa_instancetoken, kont.id, req.body.schedulewa, filename, updatedmessage);
              await whatsappSendMessage('file', tophone, nfile, req.user.wa_instanceid, req.user.wa_instancetoken, kont._id, nmsg.id, req.body.schedulewa, uploadedfile.filename, updatedmessage);
          }
          /* console.log('====================================');
          console.log('RECEIVED DATA: ' + JSON.stringify(req.body));
          console.log('RECEIVED FILE: ' + JSON.stringify(Object.keys(req.files.att_file)));
          console.log('====================================');
  
          let ofile = req.files.att_file;
          ofile.mv('tmp/whatsapp/'+ofile.name);
  
          let nfile = fs.readFileSync('tmp/whatsapp/'+ofile.name, { encoding: 'base64' });
          console.log('====================================');
          console.log(JSON.stringify(nfile));
          console.log('===================================='); */

              // sendSingleMsg(nmsg, tophone, updatedmessage, req.user.wa_instanceurl, req.user.wa_instancetoken, kont.id, req.body.schedulewa);
          // console.log("Error: Please try again later");
                      
      }

      /* async function sendSingleMsg(msg, phone, body, instanceurl, token, kid, schedule) {
          let new_resp = await whatsappSendMessage('message', phone, body, instanceurl, token, kid, msg.id, schedule);
      }
      async function sendSingleFile(msg, phone, body, instanceurl, token, kid, schedule, filename, caption) {
          let new_resp = await whatsappSendMessage('file', phone, body, instanceurl, token, kid, msg.id, schedule, filename, caption);
      } */

  }

  function makeId(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
  }

}

module.exports = sendCampaign;
