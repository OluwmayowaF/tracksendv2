/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

const phoneValidity = (phone) => {

    if(phone.length > 0) {
      var phone = phone
              .replace(/ /g, '')
              .replace(/\-/g, '')
              .replace(/\./g, '')
              .replace(/\+/g, '');

      if ((phone.length == 10) && (phone.substr(0, 1) != '0')) phone = '0' + phone;
      else if ((phone.length == 11) && (phone.substr(0, 1) == '0')) phone = phone;
      else if ((phone.length == 13) && (phone.substr(0, 3) == '234')) phone = '0' + phone.substr(-10);
      else if ((phone.length == 14) && (phone.substr(0, 4) == '2340')) phone = '0' + phone.substr(-10);
      else return false;

      return phone;
  } else return false;

}

module.exports = phoneValidity;
