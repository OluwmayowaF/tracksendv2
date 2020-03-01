var models = require('../models');

// const { default: axios } = require('axios');
// const { INSTANCEID, TOKEN , BINURL } = require('../config/cfg/chatapi')();

exports.index = async (req, res) => {
    var user_id = req.user.id;

    let msgs = await models.Custommessage.findByPk(user_id);
    let whatsapp_msg_1, whatsapp_msg_2

    console.log('====================================');
    console.log('sgs= ' + JSON.stringify(msgs));
    console.log('====================================');

    if(msgs) {
        whatsapp_msg_1 = msgs.whatsapp_optin_msg_1 || null;
        whatsapp_msg_2 = msgs.whatsapp_optin_msg_2 || null;
    }

    var flashtype, flash = req.flash('error');
    if(flash.length > 0) {
        flashtype = "error";           
    } else {
        flashtype = "success";
        flash = req.flash('success');
    }
    res.render('pages/dashboard/custom_messages', {
        page: 'Custom Messages',
        custommessages: true,
        flashtype, flash,

        args: {
            whatsapp_msg_1, 
            whatsapp_msg_2
        }
    });
};

exports.update = async (req, res) => {
    var user_id = req.user.id;

    let msgs = await models.Custommessage.findByPk(user_id);
    let whatsapp_optin_msg_1 = req.body.whatsapp_optin_msg_1 || null;
    let whatsapp_optin_msg_2 = req.body.whatsapp_optin_msg_2 || null;

    console.log('====================================');
    console.log('sgs= ' + JSON.stringify(msgs));
    console.log('====================================');

    if(msgs) {
        await msgs.update({
            ...(
                whatsapp_optin_msg_1 ? {
                    whatsapp_optin_msg_1
                } : {
                    whatsapp_optin_msg_2
                }
            )
        })
    } else {
        await models.Custommessage.create({
            userId: user_id,
            ...(
                whatsapp_optin_msg_1 ? {
                    whatsapp_optin_msg_1
                } : {
                    whatsapp_optin_msg_2
                }
            )
        })
    }

    req.flash('success', 'Message updated.');
    var backURL = req.header('Referer') || '/';
    res.redirect(backURL);
};

