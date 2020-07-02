/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

const phoneValidity = (phone, ctrycode) => {

  if(phone && phone.length > 0) {
    var phone = phone.replace(/[^0-9]/g, '');

    if(ctrycode === 1) {  //  UNITED STATES

      if (phone.length === 10) phone = phone;
      else if ((phone.length === 11) && (phone.substr(0, 1) === '1')) phone = phone.substr(-10);
      else return false;
      
      return phone;

    } else if(ctrycode === 27) {   //  SOUTH AFRICA

      if ((phone.length === 9) && (phone.substr(0, 1) !== '0')) phone = phone;
      else if ((phone.length === 10) && (phone.substr(0, 1) === '0')) phone = phone.substr(-9);
      else if ((phone.length === 11) && (phone.substr(0, 2) === '27')) phone = phone.substr(-9);
      else if ((phone.length === 12) && (phone.substr(0, 3) === '270')) phone = phone.substr(-9);
      else return false;
      
      return '0' + phone;

    } else if(ctrycode === 225) {   //  COTE D'IVOIRE NUMBERS

      if (phone.length == 8) phone = phone;
      else if ((phone.length == 11) && (phone.substr(0, 3) == '225')) phone = phone.substr(-8);
      else return false;
      
      return phone;

    } else if(ctrycode === 234) {   //  NIGERIA NUMBERS

      if ((phone.length == 10) && (phone.substr(0, 1) != '0')) phone = phone;
      else if ((phone.length == 11) && (phone.substr(0, 1) == '0')) phone = phone.substr(-10);
      else if ((phone.length == 13) && (phone.substr(0, 3) == '234')) phone = phone.substr(-10);
      else if ((phone.length == 14) && (phone.substr(0, 4) == '2340')) phone = phone.substr(-10);
      else return false;

      return '0' + phone;
      
    }  

  } else {
    console.log('|||||| phonevlidate FALSE! phone = ' + phone + "; ctrycode = " + ctrycode);
    return false;
  }

}

module.exports = phoneValidity;
