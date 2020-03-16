var fs = require('fs');

/** 
  * This module logs messages to file(s)
  * The message can either be an error, 
  * a log, or an output.
  * @param mtype type of message (error, output, whatsapp, sms, log)
  * @param modl the functinality involved
  * @param actn what exactly are you simulating
  * @param msg the content that should be logged
  * content].
  */
const filelogger = (mtype, modl, actn, msg) => {
  
    let logg = "======== "+ mtype +" >>>>>>>>>>>>>>>>>>>>>>>>>> \n";
    logg += "Module: " + modl + "\n";
    logg += "Action: " + actn + "\n";
    logg += "Message: " + msg + "\n";
    logg +=    "======== "+ mtype +" <<<<<<<<<<<<<<<<<<<<<<<<<< \n\n";

    let outputfile = 'tmp/logger/' + mtype + '.txt';

    fs.appendFile(outputfile, logg, function (err) {
      if(err) {
        console.log('====================================');
        console.log('LOGGER ERROR: ', err, logg);
        console.log('====================================');
      }
    })

    //return messagebank[type][msgcode][lang];
}

module.exports = filelogger;
