//  AFRICA'S TALKING INIT
var models = require('../../../models');
var phoneformat = require('../../phoneformat');
var filelogger = require('../../filelogger');
var env = require('../../../config/env');
var _message = require('../../output_messages');
var sendSMS = require('./../sendSMS');

const africastalkingOptions = require('../../../config/cfg/africastalking');
// var africastalking = require('africastalking')(africastalkingOptions);
const dbPostSMSSend = require('../dbPostSMSSend');
const makeId = require('../../makeId');

exports.africastalkingPlatform = async (req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
  originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj) => {

  var file_not_logged = true;
  var networkerror = false;
  console.log('1~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~');

  SINGLE_MSG = SINGLE_MSG && !UNSUBMSG && !DOSUBMSG;    //  UNSUBMSG includes individual contact ids so invariable can't be single msg

  //  MAXIMUM OF FIFTY (50) RECIPIENTS PER REQUEST :(

  // const sms = africastalking.SMS;

  // var q_reference = info.name.replace(/ /g, '_');
  // var q_type = 'sms';

  var m_name = africastalkingOptions.username;
  var m_from = sndr.name;
  // var m_reportUrl = env.SERVER_BASE + '/api/sms/africastalking/notify/';
  // var m_validity = 2 * 24 * 60 * 60; //  48 hours ...in seconds
  // var m_scheduledDatetime = schedule; //  24 hours
  // var m_mclass = 1; 

  var k = 0;
  var msgarray = '';

  async function africastalking_checkAndAggregate(kont) {
      k++;
      console.log('*******   Aggregating Contact #' + k + ':...    ********');
      let ctryid = kont.fields ? kont.fields.countryid : (kont.country ? kont.country.id : kont.countryId) ; // from perfcampaigns OR normal campaigns OR transactional msgs
      let formatted_phone = phoneformat(kont.phone, ctryid);
      if(!formatted_phone) return;
      
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
                console.log('cccccccccccccccccccc ', cpnid, "; formattedphone = ", formatted_phone );
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
              .replace(/\[firstname\]/g,  kont.firstname)
              .replace(/\[first name\]/g, kont.firstname)
              .replace(/\[lastname\]/g,   kont.lastname)
              .replace(/\[last name\]/g,  kont.lastname)
              .replace(/\[email\]/g,      kont.email)
              .replace(/\[e-mail\]/g,     kont.email)

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
                      "from" : m_from,
                      "to" : ["+" + formatted_phone],
                      "message" : updatedmessage,
                  }; 
                  
                  console.log('UNSINGLE MESSAGE ENTRY CREATE DONE.');
                  if(file_not_logged && !req.txnmessaging) {
                    filelogger('sms', 'Send Campaign (AfricasTalking)', 'sending campaign: ' + cpn.name, JSON.stringify(msgfull));
                      file_not_logged = false;
                  }    
              
                  return msgfull;
              }

            } catch(err) {
                console.log('________________________________');
                
               throw "111Error: Please try again later";
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
      
      console.log('**************   ' + 'count of contacts = ' + len + '; start = ' + start + '   ****************');
      if(start <= len) {
          var end = (start + grpn > len) ? len : start + grpn;

          let sub_list = contacts.slice(start, end);
          var destinations = []; 

          if(SINGLE_MSG) {
              console.log('SINGLE : ');
              
              for (let i = 0; i < sub_list.length; i++) {
                  destinations.push(await africastalking_checkAndAggregate(sub_list[i]));
              }

              var msgfull = { //  STEP 1 OF MESSAGE CONSTRUCTION
                  "username" : m_name,
                  "from" : m_from,
                  "to" : destinations,
                  "message" : originalmessage,
              }; 

              
              console.log('SINGLE COMPILED!');
              if(file_not_logged && !req.txnmessaging) {
                filelogger('sms', 'Send Campaign (AfricasTalking)', 'sending campaign: ' + cpn.name, JSON.stringify(msgfull));
                  file_not_logged = false;
              }    
              
              actions.push(await Promise.resolve(msgfull));

          } else {
              console.log('NOT SINGLE OOOO');
              
              for (let i = 0; i < sub_list.length; i++) {
                  actions.push(await africastalking_checkAndAggregate(sub_list[i]));
              }
              console.log('UNSINGLE COMPILED!');

          }

          let data = await Promise.all(actions);

            console.log('MSGS ARE: ' + JSON.stringify(data));
            
            let params = data[0];

            let response = await sendSMS('africastalking', params);
            // let resp_ = null;
            let resp_ = response;
            console.log(JSON.stringify(response));
            // return;

            //  IF SENDING IS COMPLETE, CHARGE BALANCE... AND OTHER HOUSEKEEPING
            let klist = sub_list.map(k => { return k._id })
            let resp = await dbPostSMSSend.dbPostSMSSend(req, res, batches, null, null, info, user_balance, user_id, cpn, schedule_, klist, resp_);

            /* const options = {
                url: 'https://'+tracksend_base_url+'/sms/2/text/advanced',
                json: tosend,
                headers: {
                    'Authorization': 'Basic ' + base64encode,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            } 
            
            request.post(options, async (err, response) => {
                if (err){
                    console.log('ERROR = ' + err);
                    failures++;
                } else {
                    //   console.log(`Status code: ${response.statusCode}. Message: ${response.body}`);
                    console.log('Status code: ' + response.statusCode + '; Message: ' + JSON.stringify(response.body));

                    if(response.statusCode == 200) {
                        successfuls++;
                    } else {
                        failures++;
                    }
                }
            }); */
    
    
            console.log(JSON.stringify(params));
            counter++;
            if(end < len) await doLoop(end)
            console.log('OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO');
            return resp;

        }

  }

  const MAX_NO_IF_NOT_SINGLE_MSGS     = 1;        // NOT FIXED FOR AFRICASTALKING
  const MAX_NO_IF_SINGLE_MSGS         = 1000;     // NOT FIXED FOR AFRICASTALKING
  const GROUPING_NO_IF_SINGLE_MSGS    = 1000;     // NOT FIXED FOR AFRICASTALKING
  var grpn    = (SINGLE_MSG) ? Math.min(MAX_NO_IF_SINGLE_MSGS, GROUPING_NO_IF_SINGLE_MSGS) : MAX_NO_IF_NOT_SINGLE_MSGS;   
  var start   = 0;
  var len     = contacts.length;
  var counter = 1;
  var batches = len;  //  Math.ceil(len/grpn);    //  afriksatalking has unique difference in successfuls + failures == batched?

  // var successfuls = 0;
  // var failures    = 0;

  console.log('Start Looping...');
  let runall = await doLoop(0);
  return runall;

  //  finally redirect back to page
  console.log('END... NEW PAGE!');

};
