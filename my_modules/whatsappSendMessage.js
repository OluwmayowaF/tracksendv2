 /* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

var models = require('../models');
const { default: axios } = require('axios');
var qs = require('qs');
var moment = require('moment');
var scheduler = require('node-schedule');
var _message = require('../my_modules/output_messages');

// const whatsappSendMessage =  async (typ, phone, body, instanceurl, token, contactid=null, msgid=null, schedule=null, filename=null, caption=null) => {
const whatsappSendMessage =  async (typ, phone, body, instanceid, token, contactid=null, msgid=null, schedule=null, filename=null, caption=null) => {
  console.log('3 kont id = ' + contactid);
  
  if(contactid) {
    let kk = await models.User.findByPk(contactid);
  console.log('4 kont = ' + JSON.stringify(kk));
    const unsubscribelink = 'https://dev2.tracksend.co/whatsapp/optout/' + contactid;
    body += _message('msg', 1071, kk.countryId, unsubscribelink);
  console.log('5 kont after ');
  }
  console.log('====================================');
  console.log('schedule.................... = ' + schedule);
  console.log('====================================');

  let ts = moment(schedule, 'YYYY-MM-DD HH:mm:ss');
  if(schedule && schedule.length > 6 && schedule != 'Invalid date' && ts != NaN) {
    //  schedule sending WhatsApp message
    
    console.log('====================================');
    console.log('whatsapp schedule.................... = ' + schedule);
    console.log('====================================');

    console.log('date = ' + ts);
    var date = new Date(ts);
    // let fn;
    scheduler.scheduleJob(date, send);

  } else {
    send();
  }

  async function send() {
    let new_resp;
    try {
      if(typ == 'message') {
        // let url = instanceurl + "sendMessage?token=" + token;
        let url = 'https://api.chat-api.com/instance' + instanceid + "/sendMessage?token=" + token;
        console.log('====================================');
        console.log('STARTING SEDNDING...' + url);
        console.log('====================================');

        new_resp = await axios({
          method: 'POST',
          url,
          // data: qs.stringify({
          data: {
              "phone": phone,
              "body": body
          },
          headers: {
            'Content-Type': 'application/json'
          //   'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      } else if(typ == 'file') {
        // let url = instanceurl + "sendFile?token=" + token;
        let url = 'https://api.chat-api.com/instance' + instanceid + "/sendFile?token=" + token;
        console.log('====================================');
        console.log('STARTING FILE SEDNDING...' + url);
        console.log('====================================');

        new_resp = await axios({
          method: 'POST',
          url,
          // data: qs.stringify({
          data: {
              "phone": phone,
              "body": body,
              "filename": filename,
              "caption": caption,
          },
          headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      }
      
      console.log('====================================');
      console.log('WHATSAPP RESP: ' + JSON.stringify(new_resp.data) + '| ; ID : ' + new_resp.data.id);
      console.log('====================================');

      if(new_resp.data) {
        console.log('====================================');
        console.log('WHATSAPP RESP: ' + JSON.stringify(new_resp.data) + '| msgid = ' + msgid + '; ID : ' + new_resp.data.id);
        console.log('====================================');
      }

      if(msgid) await models.Message.update(
        {
            message_id: new_resp.data.id,
        }, {
          where: {
            id: msgid
          }
        }
      );

      console.log('====================================');
      console.log('MSG UPDATED');
      console.log('====================================');
      // return new_resp;
      } catch(e) {
        console.log('====================================');
        console.log('errorwa: ' + e);
        console.log('errorwa: ' + JSON.stringify(e));
        console.log('====================================');
      }
  }

}

    // return { getWhatsAppStatus, whatsAppRetrieveOrCreateInstance };

module.exports = whatsappSendMessage;
