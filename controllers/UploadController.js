const Sequelize = require('sequelize');
const dbauth = require('../config/cfg/dbauth')();
var uploadMyFile = require('../my_modules/uploadHandlers');
var phoneval = require('../my_modules/phonevalidate');

var models      = require('../models');
const fs        = require('fs');
const csv       = require('fast-csv');
var moment      = require('moment');
var mysql       = require('mysql');
 
var connection  = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    user            : dbauth.dbuser,
    password        : dbauth.dbpwrd,
    database        : dbauth.dbdb,
    debug           : true
  });


// Display detail page for a specific contact.
// Display contact create form on GET.
exports.index = (req, res) => {
    var holdn = req.flash('result');    
    var user_id = req.user.id;
    console.log('user is: ' + user_id);
    

    console.log('result na: ' + holdn);
    if (holdn.length > 0) {
        var result = null;   
        var grp = '';   
        var ctry = '';   
        var fid = '';   
        var rows = '';

        console.log('1. FLASH IS:' + holdn.length + 'o');

        var result = holdn;
        grp = result.splice(result.length - 1);
        ctry = result.splice(result.length - 1);
        fid = result.splice(result.length - 1);
        rows = result.join();

        console.log('====================================');
        console.log('grp = ' + grp + '; ctry = ' + ctry + '; fid = ' + fid);
        console.log('====================================');
        res.render('pages/dashboard/upload_contacts', {

            page: 'CONTACTS',
            uploads: true,
            newcontact: true,

            args: {
                // grps: grps,
                result: result,
                rows: rows,
                fid: fid,
                grp: grp,
                ctry: ctry,
            }

        });
        
    } else {
        Promise.all([
            models.Group.findAll({ 
                where: { 
                    userId: user_id,
                    name: {
                        [Sequelize.Op.ne]: '[Uncategorized]',
                    }
                },
                order: [ 
                    ['createdAt', 'DESC']
                ]
            }), 
            models.Country.findAll({ 
                order: [ 
                    ['name', 'ASC']
                ]
            })
        ])
        .then(([grps, ctry]) => {
            // console.log('flash error = ' + req.flash('error') + '; flash suss = ' + req.flash('success'));
            
            var flashtype, flash = req.flash('error');
            if(flash.length > 0) {
                flashtype = "error";           
            } else {
                flashtype = "success";
                flash = req.flash('success');
            }
    
            res.render('pages/dashboard/upload_contacts', {
                page: 'CONTACTS',
                uploads: true,
                newcontact: true,
                flashtype, flash,

                args: {
                    grps: grps,
                    ctry: ctry,
                }
            });
            // group.createContact(req.body)
        })
        .catch((err) => {
            console.error('ERROR: ' + err);
        })
    }

}

exports.do = async (req, res) => {

    console.log('showing page...'); 
    var user_id = req.user.id;

    var fd;
    const fileRows = [];
    var headers = [];
    var has_headers = true;
    var rowcount = 0;

    if(!req.files || Object.keys(req.files).length === 0) {

    }
    let uploadedfile = await uploadMyFile(req.files.file, 'contacts');
    // await ofile.mv('tmp/whatsapp/'+tempfilename);  

    console.log('====================================');
    // console.log('KEYS: ' + JSON.stringify(req.files));
    console.log('KEYS: ' + JSON.stringify(uploadedfile));
    // console.log('KEYS: ' + JSON.stringify(req.file));
    // console.log('P1: ' + req.files.file.tempFilePath)
    // console.log('P2: ' + req.files.file.path)
    // console.log('P3: ' + req.file.path)
    console.log('====================================');
    // return;

    // csv.parseFile(req.files.path)
    csv.parseFile(uploadedfile.filepath)
    .on("data", function (data) {

        //  this is just to get the titles of the file... if user indicates titled file
        if(rowcount >= 1) {
            console.log('raw rows: ' + JSON.stringify(data) + '...' + rowcount);
        } else {
            headers = data; // push each row
        }
        
        rowcount++;

    })
    .on("end", function () {

        //  add timestamp and userId to name of csv
        var timestamp_ = new Date();
        var timestamp = timestamp_.getTime();
        var userId = user_id;
        var groupId = req.body.group;

        console.log('COUNTRY = ' + req.body.country);

        if(groupId == -1) {
            models.User.findByPk(userId)
            .then(user => {
                return user.createGroup(req.body)
            })
            .then((grp) => {
                groupId = grp.id;
                console.log('new group ID is: ' + groupId);
                
                var pth = uploadedfile.filepath.split('\\')[2];
                pth = (pth) ? pth : uploadedfile.filepath.split('/')[2];
                console.log('====================================');
                console.log('path file: ' + uploadedfile.filepath + '; split: ' + pth);
                console.log('====================================');
                headers.push(pth);
                headers.push(req.body.country);
                headers.push(groupId);
                console.log('pushing: ' + headers);
                
                req.flash('result', headers);
                var backURL = req.header('Referer') || '/'; 
                res.redirect(backURL);
                console.log('yeah');
                
                return;        
            })
            .error((err) => {
                console.log('ERROR: Creating group things' + err);
            })
        } else {
            console.log('====================================');
            console.log('path : ' + uploadedfile.filepath);
            var pth = uploadedfile.filepath.split('\\')[2];
            console.log('====================================');
            console.log('path split: ' + pth);
            pth = (pth) ? pth : uploadedfile.filepath.split('/')[2];
            console.log('====================================');
            console.log('path file: ' + uploadedfile.filepath + '; split: ' + pth);
            console.log('====================================');
            headers.push(pth);
            headers.push(req.body.country);
            headers.push(groupId);
            console.log('pushing: ' + headers);
        
            req.flash('result', headers);
            var backURL = req.header('Referer') || '/'; 
            res.redirect(backURL);
            console.log('yeah');
            
            return;
        }

    })
    .on("error", function (error) {

        console.log('sorry, error o' + error);
        
    })

};

exports.validate = (req, res) => {

    console.log('showing page...' + req.body.country); 
    var user_id = req.user.id;

    var userId = user_id;
    var groupId = req.body.group;
    var countryId = req.body.country;
    var status = 0;

    const fileRows = []; 
    var headers = '';
    var has_headers = true;
    var rowcount = 0;
    var fpath = "tmp\\contacts\\" + req.body.fid;
    var fpath2 = "tmp/contacts/" + req.body.fid;
    var rows_inp = req.body.row; 
    var rows_std = req.body.rows.split(','); 
    var rows_matched = []; 
    var order = [];

    var total_errors = 0;
    var phone_errors = 0;
    var email_errors = 0;
    
    console.log('path na: ' + fpath);
     
    // csv.parseFile(fpath, {headers: true})
    if(!fs.existsSync(fpath)) {
        fpath = fpath2;
        if(!fs.existsSync(fpath)) {
            req.flash('error', 'An error occurred, please re-upload your file.');
            res.redirect('/dashboard/upload');
            return;
        }
    }
    // fs.e
    csv.parseFile(fpath)
    .on("data", function (data) {
        //  this is just to get the titles of the file... if user indicates titled file
        fileRows.push(data); // push each row
    })
    .on("end", async function () {

        fs.unlinkSync(fpath);   // remove temp file

        console.log('pushing: ' + JSON.stringify(fileRows));
        
        // if(rows_inp.length === rows_std.length) {
        if(rows_inp.length === 4) {     //  the columns to be filled (firstname, lastname, phone, email)
            
            //  are rows already aligned or there's need to remap?
            var is_unmatched = false;
            for(var i = 0; i < rows_inp.length; i++) {
                order[i] = rows_std.indexOf(rows_inp[i]);
                if(rows_inp[i] != rows_std[i]) {
                    is_unmatched = true;
                } 
            }
            console.log('HEERREE'); 
            
            // rows_matched = fileRows.slice(1, fileRows.length);   //  the slice removes the header
            rows_matched = fileRows.slice(1, fileRows.length).map(mapfn);   //  the slice removes the header
            if(is_unmatched) {
            } 

            //  filter out corrupt entries
            var rows_trimmed = rows_matched.slice(0, 50000);   //  rows limit is 50,000
            var rows_finetuned = rows_trimmed.filter(validateCsvRow);
 
            console.log('FINAL DATA: ' + rows_finetuned);
            console.log('t_error: ' + total_errors + '; e_errors: ' + email_errors + '; p_errors: ' + phone_errors);
            
            var sql = "INSERT IGNORE INTO contacts (firstname, lastname, phone, email, userId, groupId, countryId, status) VALUES ?";
            var query = await connection.query(sql, [rows_finetuned], async function (err, result) {

                var inserted = 0;
                var duplicates = 0;
                
                if(result) {
                    inserted = result.affectedRows;
                    duplicates = result.warningCount;

                    await models.Group.findByPk(groupId)
                    .then((group) => {
                        group.update({
                            count: Sequelize.literal('count + ' + inserted),
                        })
                    })
                    .error((err) => {
                        console.log('ERROR:' + err);
                        
                    })
                } 
                if(err) {
                    console.log('ERROR: IN DUMPING');
                    
                }
                console.log('QUERY DONE: ' + JSON.stringify(result));
                console.log('QUERY ERROR: ' + err);

                // req.flash('success', 'Upload complete successfully: <b>' + inserted + '</b> duplicate contacts added; <b>' + duplicates + '</b> contacts ignored.');
                req.flash('success', 'Upload completed successfully: ' + inserted + ' contacts added; ' + duplicates + ' duplicate contacts ignored' + (phone_errors > 0 ? '; ' + phone_errors + ' contacts with invalid numbers ignored' : '') );
                res.redirect('/dashboard/upload');
                
            });
            // connection.end();
        }
        
        //process "fileRows" and respond
        

        /* const validationError = validateCsvData(fileRows);
        if (validationError) {
            return res.status(403).json({ error: validationError }); 
        } */
        //else process "fileRows" and respond
        // return res.json({ message: "valid csv" })
    })
    .on("error", function (error) {
        req.flash('error', 'An error occurred accessing your upload, please re-upload your file.');
        res.redirect('/dashboard/upload');
        return;
    })

    //  This function adds some relevant data to each row ['userId, groupId, countryId, status]
    function mapfn(row) {

        console.log('mapping row: ' + row);
        
        var tprow = [];
        for(var i = 0; i < order.length; i++) {
            tprow[i] = row[order[i]];
        }
        tprow = tprow.concat(userId, groupId, countryId, status);
        return tprow;
    }

    /* function validateCsvData(dataRows) {
        // console.log('titles are: ' + JSON.stringify(rows.slice(0, 1)));
        // const dataRows = rows.slice(1, rows.length); //ignore header at 0 and get rest of the rows
        // const dataRows = rows; //ignore header at 0 and get rest of the rows
        for (let i = 0; i < dataRows.length; i++) {
            const rowError = validateCsvRow(dataRows[i]);
            if (rowError) {
                // return `${rowError} on row ${i + 1}`
                total_errors += 1;
            }
        }
        return;
    } */

    function validateCsvRow(row) {
        /* if (!row[0]) {
            return "invalid name"
        }
        else if (!Number.isInteger(Number(row[1]))) {
            return "invalid roll number"
        }
        else if (!moment(row[2], "YYYY-MM-DD").isValid()) {
            return "invalid date of birth"
        } */
        // row = row.split(',');
        console.log('ROWS : ' + JSON.stringify(row));

        var fname = row[0];
        var lname = row[1];
        var phone = phoneval(row[2], row[6]);
        var email = row[3];
console.log('PPPPPPPPPPPPPP: ' + phone);

        if(phone) {
            row[2] = phone;
            return true;
        } else {
            total_errors++;
            phone_errors++;
            return false;
        }
        //let r_e = checkEmail(email);
        // return (checkPhone(phone));

        function checkPhone(ph) {
console.log('00phone: ' + ph);
            if(!ph) return false;
            if(ph.length > 0) {
                let phone = ph
                        .replace(/ /g, '')
                        .replace(/\-/g, '')
                        .replace(/\./g, '')
                        .replace(/\+/g, '');

console.log('0phone: ' + phone);

                if(
                    ((phone.length == 10) && (phone.substr(0, 1) != '0'))
                    ||
                    ((phone.length == 11) && (phone.substr(0, 1) == '0'))
                    ||
                    ((phone.length == 13) && (phone.substr(0, 3) == '234'))
                    ||
                    ((phone.length == 14) && (phone.substr(0, 4) == '2340'))
                ){
console.log('1phone: ' + phone);
                    return true;
                }
            }
            total_errors++;
            phone_errors++;
            return false;
        }
        function checkEmail(email) {
            if(email.length > 5) {
                return true;
            }
            total_errors++;
            email_errors++;
            return false;
        }
    }

}; 

