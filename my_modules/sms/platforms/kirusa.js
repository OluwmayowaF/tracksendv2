//  KIRUSA INIT
var models = require('../../../models');
var phoneformat = require('../../phoneformat');
var filelogger = require('../../filelogger');
var env = require('../../../config/env');
var _message = require('../../output_messages');
var sendSMS = require('./../sendSMS');

const dbPostSMSSend = require('../dbPostSMSSend');
const makeId = require('../../makeId');

const kirusa = require('../../../config/cfg/kirusa');

exports.kirusaPlatform = async (req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
  originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj) => {

  var successfuls = 0;
  var failures    = 0;
    
  var file_not_logged = true;
  var networkerror = false;
  console.log('000111~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~');

  SINGLE_MSG = SINGLE_MSG && !UNSUBMSG && !DOSUBMSG;    //  UNSUBMSG includes individual contact ids so invariable can't be single msg

  var k = 0;

  async function checkAndAggregate(kont) {
      k++;
      console.log('*******   Aggregating Contact #' + k + ':...    ******** kont = ' + JSON.stringify(kont) );
      let ctryid = kont.fields ? kont.fields.countryid : (kont.country ? kont.country.id : kont.countryId) ; // from perfcampaigns OR normal campaigns OR transactional msgs
      let formatted_phone = phoneformat(kont.phone, ctryid);
      if(!formatted_phone) {
          console.log('phone NOT formatted');
          return;
      }

      // return new Promise(resolve => {

      async function getUniqueId() {

          do {

              var uid = makeId(3);
              var exists = await models.Message.findAll({
                where: { 
                    ...(
                        (req.txnmessaging) ? {
                            shortlinkId: info.shortlinkId,
                        } : {
                            campaignId: cpn.id.toString(),
                        }
                    ),
                    contactlink: uid,
                },
          })
              .error((r) => {
                  console.log("Error: Please try again later");
              })
                  // if(uid.length)
              
          } while (exists.length);
          console.log('UID = ' + uid);
          let shrtlnk = await models.Shortlink.findByPk(info.shortlinkId);
          return {
              sid : shrtlnk.id,
              slk : shrtlnk.shorturl,
              cid: uid, 
          };
      }

      async function saveMsg(args) {
        let shrt;
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
        try {
            if(req.txnmessaging) {
                shrt = await models.Message.create({
                    shortlinkId: args.sid,
                    contactlink: args.cid,
                    contactId: '00000',
                });
            } else {
                console.log('__________________contactID = ' + kont._id);
                let cpnid = cpn.id.toString() || cpn._id.toString();
                console.log('cccccccccccccccccccc ', cpnid );
                shrt = await models.Message.create({
                    campaignId: cpnid,
                    shortlinkId: args.sid,
                    contactlink: args.cid,
                    contactId: kont._id.toString(),
                    destination: '+' + formatted_phone,
                });
            }

              console.log('MESSAGE ENTRY CREATE STARTED.:::' + JSON.stringify(shrt));
                                              
              var updatedmessage  = originalmessage
              .replace(/\[firstname\]/g, kont.firstname)
              .replace(/\[first name\]/g, kont.firstname)
              .replace(/\[lastname\]/g, kont.lastname)
              .replace(/\[last name\]/g, kont.lastname)
              .replace(/\[email\]/g, kont.email)
              .replace(/\[e-mail\]/g, kont.email)
              .replace(/\[url\]/g, 'http://tsn.pub/' + args.slk + '/' + args.cid)
              .replace(/\s{2,}/g, '')
              // .replace(/\\r/g, '')
              // .replace(/\\n/g, '')
              // .replace(/\\t/g, '')
              .replace(/&nbsp;/g, ' ');

              updatedmessage += (UNSUBMSG) ? _message('msg', 1091, ctryid, kont._id.toString()) : '';     //  add unsubscribe text
              updatedmessage += (DOSUBMSG) ? _message('msg', 1092, ctryid, kont._id.toString()) : '';     //  add unsubscribe text

              console.log('====================================');
              console.log('UNSUB MSG IS:::' + _message('msg', 1091, ctryid, kont._id));
              console.log('====================================');
              
              if(SINGLE_MSG) {
                  var msgto = "+" + formatted_phone;
                  
                  console.log('SINGLE MESSAGE ENTRY CREATE DONE.');
                  return msgto;
              } else {
                  var msgfull = { //  STEP 1 OF MESSAGE CONSTRUCTION
                    "id" : (req.txnmessaging ? 'TXNMSG' : cpn.id) + "-" + new Date().getTime().toString(),
                    // "from" : m_from,
                    "sender_mask" : sndr.name,
                    "to" : ["+" + formatted_phone],
                    "body" : updatedmessage,
                    "callback_url" : env.SERVER_BASE + '/api/sms/kirusa/notify',

                    "url": 'https://konnect.kirusa.com/api/v1/Accounts/' + kirusa.accountid + '/Messages',
                    "headers": {
                        'Authorization': kirusa.apiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                  }; 
                  
                  console.log('UNSINGLE MESSAGE ENTRY CREATE DONE.');
                  if(file_not_logged && !req.txnmessaging) {
                    filelogger('sms', 'Send Campaign (Kirusa)', 'sending campaign: ' + cpn.name, JSON.stringify(msgfull));
                      file_not_logged = false;
                  }    
              
                  return msgfull;
              }

            } catch(err) {
                console.log('________________________________');
                
               throw "111Error: Please try again later--"+JSON.stringify(err);
            }
                      
      }

      //create contact codes
      var args = {};

      if(!SINGLE_MSG && HAS_SURL) {
          console.log('GET UNIQUE ID!!!');
          
          args = await getUniqueId();
      }
      console.log('NEXT: Promise.all Done');
      
      return await saveMsg(args);

      // })
  }

  //  loop through all the batches
  async function doLoop(start) { 
      let actions = [];
      
      console.log('**************   ' + 'count of contacts = ' + len + '; start = ' + start + '   ****************' + JSON.stringify(contacts));
      if(start <= len) {
          var end = (start + grpn > len) ? len : start + grpn;

          let sub_list = contacts.slice(start, end);
          var destinations = []; 

          if(SINGLE_MSG) {
              console.log('SINGLE : ');
              
              for (let i = 0; i < sub_list.length; i++) {

                  let checkAndAggregate_ = await checkAndAggregate(sub_list[i]);
                  if(checkAndAggregate_) destinations.push(checkAndAggregate_);
              }

              var msgfull = { //  STEP 1 OF MESSAGE CONSTRUCTION
                "id" : (req.txnmessaging ? 'TXNMSG' : cpn.id) + "-" + new Date().getTime().toString(),
                // "from" : m_from,
                  "sender_mask" : sndr.name,
                  "to" : destinations,
                  "body" : originalmessage,
                  "callback_url" : env.SERVER_BASE + '/api/sms/kirusa/notify',

                  "url": 'https://konnect.kirusa.com/api/v1/Accounts/' + kirusa.accountid + '/Messages',
                  "headers": {
                      'Authorization': kirusa.apiKey,
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                  }
                }; 

              console.log('SINGLE COMPILED!');
              if(file_not_logged && !req.txnmessaging) {
                filelogger('sms', 'Send Campaign (Kirusa)', 'sending campaign: ' + cpn.name, JSON.stringify(msgfull));
                  file_not_logged = false;
              }    
              
              actions.push(await Promise.resolve(msgfull));

          } else {
              console.log('NOT SINGLE OOOO');
              
              for (let i = 0; i < sub_list.length; i++) {
                  console.log('----to aggr: ' +JSON.stringify(sub_list[i]));
                let checkAndAggregate_ = await checkAndAggregate(sub_list[i]);
                if(checkAndAggregate_) {
                    console.log('.........checkaggr.......');
                    actions.push(checkAndAggregate_);
                } else {
                    console.log('.........no-checkaggr.......');
                }
              }
              console.log('UNSINGLE COMPILED!');

          }

          let data = await Promise.all(actions);
        //   .then(async (data) => {
              console.log('MSGS ARE: ' + JSON.stringify(data));
              
              let params = data[0];

              let response = await sendSMS('kirusa', params);
              // let resp_ = null;
              if (response) {
                //   console.log(`Status code: ${response.statusCode}. Message: ${response.body}`);
                if(response.data) console.log('KIRUSA Status code: ' + JSON.stringify(response.data.status));
                if(response.code) console.log('KIRUSA Status code: ' + JSON.stringify(response.code));
                
                if(response.code == "ENOTFOUND") networkerror = true;

                if(response.data && response.data.status == "ok") {
                    successfuls++;
                } else {
                    failures++;
                }
              }

              //  IF SENDING IS COMPLETE, CHARGE BALANCE... AND OTHER HOUSEKEEPING
              let klist = sub_list.map(k => { return k._id })
              let resp = await dbPostSMSSend.dbPostSMSSend(req, res, batches, successfuls, failures, info, user_balance, user_id, cpn, schedule_, null, null, networkerror);
              console.log('a||||||||||||||||||||||||---' + JSON.stringify(resp));
        
              counter++;
              if(end < len) await doLoop(end)
              console.log('paramsparams=' + JSON.stringify(params));
              return resp;
          
      }

  }

  const MAX_NO_IF_NOT_SINGLE_MSGS     = 1;        // NOT FIXED FOR KIRUSA
  const MAX_NO_IF_SINGLE_MSGS         = 1000;     // NOT FIXED FOR KIRUSA
  const GROUPING_NO_IF_SINGLE_MSGS    = 1000;     // NOT FIXED FOR KIRUSA
  var grpn    = (SINGLE_MSG) ? Math.min(MAX_NO_IF_SINGLE_MSGS, GROUPING_NO_IF_SINGLE_MSGS) : MAX_NO_IF_NOT_SINGLE_MSGS;   
  var start   = 0;
  var len     = contacts.length;
  var counter = 1;
  var batches = Math.ceil(len/grpn);    //  afriksatalking has unique difference in successfuls + failures == batched?
// console.log('==============CNTACTS =' + JSON.stringify(contacts));
  // var successfuls = 0;
  // var failures    = 0;

  console.log('Start Looping...');
  let runall = await doLoop(0);
  return runall;
};
