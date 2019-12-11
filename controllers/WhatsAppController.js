var models = require('../models');
const sequelize = require('../config/cfg/db');
var moment = require('moment');
const CHARS_PER_SMS = 160;
const _ = require('lodash');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var models = require('../models');

exports.getQRCode = async (req, res) => {

    var { whatsAppRetrieveOrCreateInstance } = require('../my_modules/whatsappHandlers')();

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    var qrcode = null;

    console.log('showing page...integrations...'); 

    let status = await whatsAppRetrieveOrCreateInstance(user_id);
    var code = status.code;
    var error = status.error;

    res.send({
        code,
        error,
    })

}

exports.notifyAck = (req, res) => {
    
    console.log('[[====================================');
    console.log('POST CHATAPI RESPONSE: ...');// + JSON.stringify(req.body));
    console.log('====================================]]');

    // res.sendStatus(200);
    res.send("ok");

}

exports.preOptIn = async (req, res) => {

    const randgen = require('../my_modules/randgen');
    var whatsappSendMessage = require('../my_modules/whatsappSendMessage');
    var phoneformat = require('../my_modules/phoneformat');

    //  for the sake of it, the only useful part of the 'clientid' is the third part of it... which is the client's userId
    let uid = req.body.clientid.split('_')[2];

    console.log('[[====================================');
    console.log('OPT-IN DATA: ...' + JSON.stringify(req.body) + 'UID = ' + uid);
    console.log('====================================]]');

    try {
        let user = await models.User.findByPk(uid);
        let uniquecode = await randgen('misc', models.Tmpoptin, 5, 'fullalphnum');
        let kont = await user.createTmpoptin({
            firstname: req.body.fullname.split(' ')[0],
            lastname: req.body.fullname.split(' ')[1],
            phone: req.body.phone,
            countryId: req.body.country,
            misc: uniquecode,
        })

        let newurl = 'https://dev2.tracksend.co/WhatsApp/optin?code='+uniquecode;
        let phone = phoneformat(req.body.phone, req.body.country);
        let body = 'Hello ' + req.body.fullname.split(' ')[0] + 
                   ', thanks for opting in to our WhatsApp platform. One last thing, please use this link to confirm and finish: ' + newurl;

        let new_resp = await whatsappSendMessage(phone, body, user.wa_instanceurl, user.wa_instancetoken);

    } catch(e) {
        if(e.name == 'SequelizeUniqueConstraintError') {
            res.send({
                status: "error",
                msg: "You've already opted in.",
            });
            return;
        }
    }
    // res.sendStatus(200);
    res.send("ok"); 

}

exports.postOptin = async function(req, res) {

    let ucode = req.query.code;
    console.log('code = ' + ucode);
    

    let uid = await models.Tmpoptin.findOne({
        where: {
            misc: ucode,
        },
        attributes: ['userId'],
    });

    if(uid == null) {
        console.log('ERROR IN CODE');
        
        res.render('pages/redirect-error', {
            page: '',
    
        });
        return;
    } 

    console.log('====================================');
    console.log('user id = ' + uid + '; json... ' + JSON.stringify(uid));
    console.log('====================================');

    let getgroups = await models.Group.findAll({
        where: {
            userId: uid,
        },
        attributes: ['id', 'name'],
    })

    res.render('pages/dashboard/whatsappcompleteoptin', {
        _page: 'WhatsApp Opt-In',
        grps: getgroups,

    });


}

