const Sequelize = require('sequelize');
const sequelize = require('../config/cfg/db');
const dbauth = require('../config/cfg/dbauth')();
var uploadMyFile = require('../my_modules/uploadHandlers');
var phoneval = require('../my_modules/phonevalidate');
var mongmodels = require('../models/_mongomodels');

var models      = require('../models');
const fs        = require('fs');
const csv       = require('fast-csv');
var moment      = require('moment');
var mysql       = require('mysql');
const _ = require('lodash');
 
var connection  = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    user            : dbauth.dbuser,
    password        : dbauth.dbpwrd,
    database        : dbauth.dbdb,
    debug           : true
  });

const MAX_UPLOAD_RECORDS = 1000000;

// Display detail page for a specific contact.
// Display contact create form on GET.
exports.index = async (req, res) => {
    var holdn = req.flash('result');    
    var user_id = req.user.id;
    console.log('user is: ' + user_id);
    

    console.log('result na: ' + holdn);
    if (holdn.length > 0) { //  second time page open with details
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
        console.log('grp = ' + grp + '; ctry = ' + ctry + '; fid = ' + fid + '; result = ' + result);
        console.log('====================================');

        //  POPULATE STANDARD ROWS
        const standard_fields = [
            { name: 'First Name',     value: 'first_name' },
            { name: 'Last Name',      value: 'last_name' },
            { name: 'Full Name',      value: 'full_name' },
            { name: 'Email',          value: 'email' },
            { name: 'Phone',          value: 'phone' },
            { name: 'Gender',         value: 'gender' },
            { name: 'Age',            value: 'age' },
            { name: 'Date of Birth',  value: 'dob' },
            { name: 'Marital Status', value: 'marital_status' },
            { name: 'Religion',       value: 'religion' },
            { name: 'Tribe',          value: 'tribe' },
            { name: 'Nationality',    value: 'nationality' },
        ];

        // let list = null;
        let list = await sequelize.query(
            "SELECT * FROM standardcontactfields"
        ).then(([results, metadata]) => {
            console.log(JSON.stringify(results));
            return results;
        });

        // console.log('listing = ' + list.lemgth);
        let std_list_grp1 = list.filter(i => {
            return (i.grouping === 1);
        })
        let std_list_grp2 = list.filter(i => {
            return (i.grouping === 2);
        })

        /* let str = '';
        standard_fields.forEach(f => {
            str += '<option>' + f + '</option>';
        }) */

        res.render('pages/dashboard/upload_contacts', {

            page: 'CONTACTS',
            uploads: true,
            newcontact: true,

            args: {
                // grps: grps,
                result,
                rows,
                fid,
                grp,
                ctry,
                std_list_grp1,
                std_list_grp2,
                // standard_fields: str,
            }

        });
        
    } else {//  first time page new
        Promise.all([
            mongmodels.Group.find({
                userId: user_id,
                name: {
                    $ne: '[Uncategorized]',
                }
            }, (err, res) => {
                return res;
                // grps.push(...res);
            })
            .sort({
                "createdAt": -1
            }),                 
            models.Country.findAll({ 
                where: {
                    status: 1
                },
                order: [ 
                    ['name', 'ASC']
                ]
            })
        ])
        .then(([grps, ctry]) => {
            // console.log('.....................flash error = ' + req.flash('error') + '; flash suss = ' + req.flash('success'));
            // console.log('________________grps=', JSON.stringify(grps));
            // req.flash('success', 'Upload completed successfully: contacts with invalid numbers ignored');
            
            var flashtype, flash = req.flash('error');
            if(flash.length > 0) {
                flashtype = "error";           
            } else {
                flashtype = "success";
                flash = req.flash('success');
            }
            // else req.flash('error', 'Upload failure. Please try again later or contact Admin');
        
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
        if(rowcount === 0) {
            headers = data; // push each row
        }
        
        rowcount++;

    })
    .on("end", async function () {

        //  add timestamp and userId to name of csv
        var timestamp_ = new Date();
        var timestamp = timestamp_.getTime();
        var userId = user_id;
        var groupId = req.body.group;

        console.log('COUNTRY = ' + req.body.country);

        if(groupId == -1) {
            let user = await models.User.findByPk(userId)
            console.log('creating new contact and group' + JSON.stringify(req.body));
            // var group = await user.createGroup(req.body);

            var grp = await mongmodels.Group.create({
                // id: 123,
                name: req.body.name,
                userId,
                description: req.body.description,
                count: 0,
            }/* , (err, res) => {
                console.log('________created group ERROR: ' + JSON.stringify(err));
                console.log('________created group details: ' + JSON.stringify(res));
            } */);
            groupId = grp._id;
            console.log('new group ID is: ' + groupId);
        }
        
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
        /* })
        .error((err) => {
            console.log('ERROR: Creating group things' + err);
        }) */

    })
    .on("error", function (error) {

        console.log('sorry, error o' + error);
        
    })

};

exports.validate = async (req, res) => {
// return;
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
    var rows_matched; 
    var order = [];

    var total_errors = 0;
    var phone_errors = 0;
    var email_errors = 0;
    
    console.log('path na: ' + fpath);

    var fields = getDataColumns(req.body), otherfields
    var countryinfo = await models.Country.findByPk(countryId, {
        attributes: ['name', 'abbreviation']
    })
    if(!countryinfo) {
        console.log('========== ERROR WITH COUNTRY ID ===========');
        return;
    }

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
        fileRows.push(data); // push each row
    })
    .on("end", async function () {

        fs.unlinkSync(fpath);   // remove temp file

        // console.log('________fileRows: ' + JSON.stringify(fileRows));
        
        rows_matched = fileRows.slice(1, fileRows.length).map(mapfn);   //  the slice removes the header
        // console.log('______rows_matched = ' + JSON.stringify(rows_matched));

        //  filter out corrupt entries
        var rows_trimmed = rows_matched.slice(0, MAX_UPLOAD_RECORDS);   //  rows limit is 50,000
        // console.log('______rows_trimmed = ' + JSON.stringify(rows_trimmed));
        var rows_finetuned = rows_trimmed.filter(validateCsvRow);

        // console.log('________FINAL DATA: ' + JSON.stringify(rows_finetuned));
        console.log('t_error: ' + total_errors + '; e_errors: ' + email_errors + '; p_errors: ' + phone_errors);
        console.log('t_error: ' + total_errors + '; e_errors: ' + email_errors + '; p_errors: ' + phone_errors);
        // return;

        let finished = await mongmodels.Contact.insertMany(JSON.parse(JSON.stringify(rows_finetuned))) //   for massive amount of bulk insert

        // console.log('________FINISHED = ' + JSON.stringify(finished));
        let inserted = 0;
        if(finished) {
            inserted = finished.length;
            // duplicates = result.warningCount;
        } else {
            console.log('ERROR: IN INSERTING CONTACTS');
        }
        
        // req.flash('success', 'Upload complete successfully: <b>' + inserted + '</b> duplicate contacts added; <b>' + duplicates + '</b> contacts ignored.');
        // if(inserted) req.flash('success', 'Upload completed successfully: ' + inserted + ' contacts added; ' + duplicates + ' duplicate contacts ignored' + (phone_errors > 0 ? '; ' + phone_errors + ' contacts with invalid numbers ignored' : '') );
        if(inserted) req.flash('success', 'Upload completed successfully: ' + inserted + ' contacts added' + ((phone_errors) ? '; ' + phone_errors + ' contacts with invalid numbers ignored' : '.'));
        else req.flash('error', 'Upload failure. Please try again later or contact Admin');
        res.redirect('/dashboard/upload');
        
    })
    .on("error", function (error) {
        req.flash('error', 'An error occurred accessing your upload, please re-upload your file.');
        res.redirect('/dashboard/upload');
        return;
    })

    //  This function extracts the required field names from the inputs
    function getDataColumns(data) {
        let len = data.fieldscount;
        let fields_ = [], val;
        let otherfields_ = [];

        for(let i = 0; i < len; i++) {
            if(data['row_' + i] == "n_0") {
                val = null;
            } else if(data['row_' + i] == "n_f") {
                // val = data['newfield_' + i];
                otherfields_.push({name: data['newfield_' + i], num: i});
                // otherfields[data['newfield_' + i]] = '';
            } else {
                val = data['row_' + i]
            }
            fields_.push(val);
        }

        if(Object.keys(otherfields_).length) {
            otherfields = otherfields_;
            fields_.push({otherfields});
        }
        console.log('FILS ARE = ' + JSON.stringify(fields_));
        return fields_;
    }

    //  This function adds some relevant data to each row ['userId, groupId, countryId, status]
    function mapfn(row) {
        let obj = {};
        let chk;
        obj['otherfields'] = {};

        row.forEach((val, i) => {
            if(chk = _.find(otherfields, function(o) { return i == o.num; })) {
                // console.log('OTHER FOUND @ i = ' + i);
                obj['otherfields'][textToSluggish(chk.name)] = val;
            } else {
                // console.log('OTHER NOOOOT FOUND @ i = ' + i);
                if(fields[i]) obj[fields[i]] = val;
            }

        })
        obj['userId'] = userId;
        obj['groupId'] = groupId;
        obj['country'] = {
            id: countryId,
            name: countryinfo.name,
            abbreviation: countryinfo.abbreviation,
        }
        return obj;
    }

    //  This function validates the fields, especially phone number
    function validateCsvRow(row) {
        var phone = phoneval(row.phone, row.country.id);
        var email = row.email;

        if(phone) {
            // console.log('.................true');
            row.phone = phone;
            return true;
        } else {
            // console.log('.................false');
            total_errors++;
            phone_errors++;
            return false;
        }
        //let r_e = checkEmail(email);
        // return (checkPhone(phone));

        function checkEmail(email) {
            if(email.length > 5) {
                return true;
            }
            total_errors++;
            email_errors++;
            return false;
        }
    }

    //  This function converts texts to slug forms
    function textToSluggish(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '_')
            .replace(/^-+/g, '')
            .replace(/-+$/g, '');
    }

}; 

