 /* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

var models = require('../models');
var Referer = require('referer-parser');

const getUrlReferer =  async (req, urlid) => {
  let refer = req.headers.referer, medium, referer;// 'https://www.facebook.com';//req.headers.referer;

  /* let ref_ = (req.headers.referer == '') ? /direct/ : /other/;
        //  track referer
        const refererlist = [
            /facebook.com/,
            /instagram.com/,
            /twitter.com/,
            /linkedin.com/,
            /pinterest.com/,
        ];
        
        refererlist.some(rx => {
            if(rx.test(referer)) ref_ = rx;
        });
        console.log('====================================');
        console.log('host url is: ' + req.protocol + '://' + req.get('host'));
        console.log('====================================');

        let ref = (new RegExp(ref_)).source; 
        ref = ref.replace('.com', '');
        console.log('normal ref: ' + ref); */

        if(!refer) {
          medium = null;
          referer = 'other';
      } else {
          var r = new Referer(req.headers.referer, req.protocol + '://' + req.get('host'));
          console.log('====================================');
          console.log('pluggedin url = ' + JSON.stringify(r.referer));
          console.log('====================================');

          if(r.referer && r.known) {
              medium = r.medium;
              referer = r.referer;
          } else {
              medium = null;
              referer = 'unknown';
          }
      }
      
      //    and store in db
      models.Linkreferer.create({
          shortlinkId: urlid,
          referer,
          medium,
      }) 

}

    // return { getWhatsAppStatus, whatsAppRetrieveOrCreateInstance };

module.exports = getUrlReferer;
