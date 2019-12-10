 /* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

const { default: axios } = require('axios');
var qs = require('qs');

const whatsappSendMessage =  async (phone, body, instanceurl, token) => {
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

  return new_resp;

}

    // return { getWhatsAppStatus, whatsAppRetrieveOrCreateInstance };

module.exports = whatsappSendMessage;
