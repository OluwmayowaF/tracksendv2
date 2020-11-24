const _ = require('lodash');
const Sequelize = require('sequelize');
var models = require('../models');
const request = require('request');
const { initializePayment, verifyPayment } = require('../config/paystack')(request);
const randgen = require('../my_modules/randgen');
var env = require('../config/env');
var apiController     = require('./ApiController');

exports.triggerHookAdd = async (req, res) => {
    
    let snd;
    console.log('ZZZZZZZZZZZZZZZAAAAPIERNEW -- AUTH = ' + req.header('X-API-KEY') + ', DATA: ' + JSON.stringify(req.body));
    /* let seen = [];
    console.log(JSON.stringify(req, function (key, val) {
        if (val != null && typeof val == "object") {
            if (seen.indexOf(val) >= 0) {
                return;
            }
            seen.push(val);
        }
        return val;
    }) ) */

    try {
        let usr = await models.User.findOne({
            where: {
                api_key: req.header('X-API-KEY'),
            },
            attributes: ['id'],
        })
        console.log('..........finding user...');

        if(usr) {

            console.log('..........YES, found user');
            
            let zp = await models.Zapiertrigger.create({
                name: req.body.triggername,
                hookUrl: req.body.hookUrl,
                userId: usr.id,
            });
            console.log('..........created trigger is: ' + JSON.stringify(zp));

            if(zp) {
                console.log('zp id = ' + zp.id);
                
                snd = {
                    status: "OK",
                    url: req.body.hookUrl,
                    trigger: req.body.triggername,
                    id: zp.id,
                }
            } else throw 'my create trigger error'
        } else throw 'user select error: wrong api_key'

    } catch(err) {
        console.log('Zapier Trigger Error: ' + JSON.stringify(err));
        snd = {
            status: "ERROR",
            url: req.body.hookUrl,
            trigger: req.body.triggername,
        }
    }

    res.status(200).json(snd);

};

exports.triggerHookRemove = async (req, res) => {

    let snd;
    console.log('DEL -- AUTH = ' + req.header('X-API-KEY'));
    console.log('body = ' + JSON.stringify(req.body));

    try {
        let usr = await models.User.findOne({
            where: {
                api_key: req.header('X-API-KEY'),
            },
            attributes: ['id'],
        })

        if(usr) {
            models.Zapiertrigger({
                where: {
                    userId: usr.id,
                    id: req.body.triggerid,
                    name: req.body.triggername,
                }
            });

            console.log('zp deleted');
            
            snd = {
                status: "OK",
            }
        } else throw 'user select error: wrong api_key'

    } catch(err) {
        console.log('Zapier Trigger Error: ' + JSON.stringify(err));
        snd = {
            status: "ERROR",
        }
    }

    res.status(200).json(snd);


};

exports.contactUpdate = async (req, res) => {

    let snd;
    console.log('CONTACT -- AUTH = ' + req.header('X-API-KEY'));
    console.log('body = ' + JSON.stringify(req.body));

    try {

        req.externalapi = true;
        req.zapier = true;
        req.body.token = req.header('X-API-KEY');

        // if(req.body.id)
        return await apiController.updateGroup(req, res);

    } catch(err) {
        console.log('Zapier Trigger Error: ' + JSON.stringify(err));
        snd = {
            status: "ERROR",
        }
    }

    res.status(200).json(snd);

};

exports.groupUpdate = async (req, res) => {

    let snd;
    console.log('CONTACT -- AUTH = ' + req.header('X-API-KEY'));
    console.log('body = ' + JSON.stringify(req.body));

    try {

        req.externalapi = true;
        req.zapier = true;
        req.body.token = req.header('X-API-KEY');

        // if(req.body.id)
        return await apiController.updateGroup(req, res);

    } catch(err) {
        console.log('Zapier Trigger Error: ' + JSON.stringify(err));
        snd = {
            status: "ERROR",
        }
    }

    res.status(200).json(snd);

};

exports.optinOptout = async (req, res) => {


};

exports.testdata = (req, res) => {

    console.log('ZZZZZAAAAAAPPPPPPPIIIIIEEEEEEEEEEERRRRRRRR');
    console.log('AUTH = ' + req.header('X-API-KEY'));

    res.status(200).json({status: "OK"});
    // res.status(200).send('some text');

};

exports.getTestDataContact = (req, res) => {

    console.log('GEEEEEETTTTTTT CCCCCOOOOOOONNNNNNNNNTTTTTTTAAAACCCTTTTTTTTTTTTSSSSSS');
    console.log('AUTH = ' + req.header('X-API-KEY'));

    res.status(200).json([
        {
            "action": "add",
            "contact_id": "2e34tr56rhr5tred4",
            "group_id": "323f234f3f3"
        },
        {
            "action": "add",
            "contact_id": "12e34trfg56rhr5tred4",
            "group_id": "54323f234f3f3"
        },
    ]);
    // res.status(200).send('some text');

};

exports.getTestDataGroup = (req, res) => {

    console.log('GEEEEEETTTTTTT CCCCCOOOOOOONNNNNNNNNTTTTTTTAAAACCCTTTTTTTTTTTTSSSSSS');
    console.log('AUTH = ' + req.header('X-API-KEY'));

    res.status(200).json([
        {
            action: "add",
            group_id: "fh555y5trg5",
            group_name: "gurupi"
        }
    ]);
    // res.status(200).send('some text');

};

exports.getTestDataOpt = (req, res) => {

    console.log('GEEEEEETTTTTTT CCCCCOOOOOOONNNNNNNNNTTTTTTTAAAACCCTTTTTTTTTTTTSSSSSS');
    console.log('AUTH = ' + req.header('X-API-KEY'));

    res.status(200).json([
        {
            action: "in",
            contact_id: "53423443f32ffsdfefef",
        }
    ]);
    // res.status(200).send('some text');

};

