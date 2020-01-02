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

const whatsappSendMessage =  async (phone, body, instanceurl, token, contactid=null, msgid=null, schedule=null) => {

  if(contactid) {
    const unsubscribelink = 'https://dev2.tracksend.co/whatsapp/optout/' + contactid;
    body += '\n\nTo Opt Out from this particular message list, kindly click: ' + unsubscribelink;
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

    let url = instanceurl + "/message?token=" + token;
    console.log('====================================');
    console.log('STARTING SEDNDING...' + url);
    console.log('====================================');

    const new_resp = await axios({
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

  }

}

    // return { getWhatsAppStatus, whatsAppRetrieveOrCreateInstance };

module.exports = whatsappSendMessage;
