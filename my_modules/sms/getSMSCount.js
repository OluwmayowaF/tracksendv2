/* 

   

*/

const getSMSCount = (txt) => {

  let len = txt.length;

  const SMS_SIZE_MSG1 = 160;
  const SMS_SIZE_MSG2 = 150;
  const SMS_SIZE_MSG3 = 150;
  const SMS_SIZE_MSG4 = 150;

  if(len <= SMS_SIZE_MSG1) {
      return 1;
  } else if(len <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2)) {
      return 2;
  } else if(len <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2 + SMS_SIZE_MSG3)) {
      return 3;
  } else if(len <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2 + SMS_SIZE_MSG3 + SMS_SIZE_MSG4)) {
      return 4;
  } else {
      return 5;
  }

}

module.exports = getSMSCount;
