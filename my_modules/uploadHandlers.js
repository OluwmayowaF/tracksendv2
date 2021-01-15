/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

const fs      = require('fs');
const randgen = require('../my_modules/randgen');

const uploadHandlers = async (oldfile, type) => {

    // let oldfile = file;
    let filename_ = oldfile.name.split('.'); 
    let filename = filename_[0].substr(0, 20); 
    filename = ((filename_[0] > filename) ? filename.substr(0, 14) + '_trunc' : filename) + '.' + filename_[1];     // CHECK AGAIN: ...consider adding .length
    
    let tempfilename = await randgen('', '', '', 20, 'fullalphnum', '_');
    var timestamp_ = new Date();
    var timestamp = timestamp_.getTime();
    tempfilename += '_' + timestamp + '.' + filename_[1];

    let filepath = 'tmp/' + type + '/'+tempfilename;
    // let parentpath = 
    if(!fs.existsSync('tmp/' + type)) fs.mkdirSync('tmp/' + type);

    await oldfile.mv(filepath);  
    
    // let nfile = await fs.readFileSync('tmp/whatsapp/'+tempfilename, { encoding: 'base64' });
    // nfile = 'data:' + oldfile.mimetype + ';base64,' + nfile;
    // console.log('tepfile = ' + tempfilename + '; filenae = ' + filename + '; base64 = ' + nfile);
    // sendSingleFile(nmsg, tophone, nfile, req.user.wa_instanceurl, req.user.wa_instancetoken, kont.id, req.body.schedulewa, filename, updatedmessage);

    return { 
        filename, 
        filepath, 
        mimetype: oldfile.mimetype 
    };
}

module.exports = uploadHandlers;
