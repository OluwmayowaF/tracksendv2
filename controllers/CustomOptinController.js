var models = require('../models');

// const { default: axios } = require('axios');
// const { INSTANCEID, TOKEN , BINURL } = require('../config/cfg/chatapi')();

exports.index = async (req, res) => {
    const Sequelize = require('sequelize');
    var env = require('../my_modules/env');
    var user_id = req.user.id;

    // let msgs = await models.Customoptin.findByPk(user_id);
    let msg_1 = "Hello [firstname], thanks for opting in to our platform. ";
    let msg_2 = "Thanks [firstname]. Opt-in to [companyname] messaging platform compeleted successfully.";
    let optchs, msgchs;

    await Promise.all([
        models.Group.findAll({      //  get all groups for display in form, except uncategorized group
            where: { 
                userId: user_id,
                name: {
                    [Sequelize.Op.ne]: '[Uncategorized]',
                }
            },
            attributes: ['id', 'name'],
            order: [ 
                ['createdAt', 'DESC']
            ],
            raw: true,
        }),
        models.Customoptin.findByPk(user_id),
        models.Customoptinquestion.findAll({ 
            where: { 
                userId: user_id,
            },
            order: [ 
                ['createdAt', 'ASC']
            ]
        })
    ]).then(async ([grps, opt, ques]) => {
        if(!opt) {
            await models.Customoptin.create({
                userId: user_id,
                optin_generallink: user_id,
            })
            opt = await models.Customoptin.findByPk(user_id);
        }
    
        if(grps) {
            grps = grps.map(g => {
                let arr = opt.optin_grps ? opt.optin_grps.split(',') : [];
                g.selected = (arr.includes(g.id.toString())) ? true : false;
                
                return g;
            });
        } 

        msg_1 = opt.optin_msg1 || msg_1;
        msg_2 = opt.optin_msg2 || msg_2;
        let msgch_1 = opt.msg1_channels ? (opt.msg1_channels.toString().split(',') || []) : [];
        let msgch_2 = opt.msg2_channels ? (opt.msg2_channels.toString().split(',')  || []) : [];
        let optch   = opt.optin_channels ? (opt.optin_channels.toString().split(',')  || []) : [];

        msgchs = {
            msgch_1_sms      : msgch_1.includes('sms'),
            msgch_1_whatsapp : msgch_1.includes('whatsapp'),
            msgch_2_sms      : msgch_2.includes('sms'),
            msgch_2_whatsapp : msgch_2.includes('whatsapp'),
        }
        optchs = {
            ch_sms      : optch.includes('sms'),
            ch_whatsapp : optch.includes('whatsapp'),
        }
        

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }
        res.render('pages/dashboard/custom_optin', {
            page: 'Custom Opt-In',
            customoptin: true,
            settingsmenu: true,
            flashtype, flash,

            args: {
                grps, 
                opt_link_base: env.SERVER_BASE + "/optin/", 
                opt_link_link: opt.optin_generallink, 
                option_two_click: (opt && opt.optin_type && opt.optin_type == 'two-click') ? true : false,
                option_complete: (opt && opt.optin_type && opt.optin_type == 'complete') ? true : false,
                ques, 
                msg_1, 
                msg_2,
                optchs,
                msgchs,
            }
        });
    })
    /* let grps = await models.Group.findAll({      //  get all groups for display in form, except uncategorized group
        where: { 
            userId: user_id,
            name: {
                [Sequelize.Op.ne]: '[Uncategorized]',
            }
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    }) */


};

exports.updatemsg = async (req, res) => {
    var user_id = req.user.id;

    let msgs = await models.Customoptin.findByPk(user_id);
    let optin_msg1 = req.body.optin_msg1 || null;
    let optin_msg2 = req.body.optin_msg2 || null;
    let msg1arr = [];
    if(req.body.notif1_sms && (req.body.notif1_sms == 'on')) msg1arr.push('sms');
    if(req.body.notif1_whatsapp && (req.body.notif1_whatsapp == 'on')) msg1arr.push('whatsapp');
    let msg2arr = [];
    if(req.body.notif2_sms && (req.body.notif2_sms == 'on')) msg2arr.push('sms');
    if(req.body.notif2_whatsapp && (req.body.notif2_whatsapp == 'on')) msg2arr.push('whatsapp');

    console.log('====================================');
    console.log('gggs= ' + JSON.stringify(msgs));
    console.log('====================================');

    if(msgs) {
        await msgs.update({
            ...(
                optin_msg1 ? {
                    optin_msg1
                } : {
                    optin_msg2
                }
            ),
            ...(
                msg1arr.length ? {
                    msg1_channels: msg1arr.toString()
                } : {}
            ),
            ...(
                msg2arr.length ? {
                    msg2_channels: msg2arr.toString()
                } : {}
            ),
        })
    } else {
        await models.Customoptin.create({
            userId: user_id,
            ...(
                optin_msg1 ? {
                    optin_msg1
                } : {
                    optin_msg2
                }
            ),
            ...(
                msg1arr.length ? {
                    msg1_channels: msg1arr.toString()
                } : {}
            ),
            ...(
                msg2arr.length ? {
                    msg2_channels: msg2arr.toString()
                } : {}
            ),
        })
    }

    req.flash('success', 'Message updated.');
    var backURL = req.header('Referer') || '/';
    res.redirect(backURL);
};

exports.addquestion = async (req, res) => {
    var user_id = req.user.id;
    // var user_id = 10;

    var nwq;
    let optin = await models.Customoptin.findByPk(user_id);

    //  check if user is in customoptin
    if(!optin) {
        optin = await models.Customoptin.create({
            userId: user_id,
        });
    } 

    //  add question to custumoptinquestions
    let ques = await models.Customoptinquestion.findAll({
        where: {
            userId: user_id
        }
    })

    if(ques.length < 5) {
        console.log('####################' + ques.length);
        
        nwq = await models.Customoptinquestion.create({
            userId: user_id,
            type: req.body.question_type,
            title: req.body.new_question_title,
            ...(
                (req.body.question_response && req.body.question_response[0]) ? {
                    option1: req.body.question_response[0]
                } : {}
            ),
            ...(
                (req.body.question_response && req.body.question_response[1]) ? {
                    option2: req.body.question_response[1]
                } : {}
            ),
            ...(
                (req.body.question_response && req.body.question_response[2]) ? {
                    option3: req.body.question_response[2]
                } : {}
            ),
            ...(
                (req.body.question_response && req.body.question_response[3]) ? {
                    option4: req.body.question_response[3]
                } : {}
            ),
            ...(
                (req.body.question_response && req.body.question_response[4]) ? {
                    option5: req.body.question_response[4]
                } : {}
            ),
            ...(
                req.body.chk_polar ? {
                    polartype: req.body.chk_polar
                } : {}
            ),
        })

        res.send({
            code: "SUCCESS",
            newid: nwq.id
        })
    } else {
        res.send({
            code: "FAIL",
            msg: "Questions limit reached."
        })
    }


    // req.flash('success', 'Message updated.');
    // var backURL = req.header('Referer') || '/';
    // res.redirect(backURL);
};

exports.delquestion = async (req, res) => {
    var user_id = req.user.id;
    var del_id = req.params.id;
console.log('ddddd = '+del_id);

    let que = await models.Customoptinquestion.findOne({
        where: {
            id: del_id,
            userId: user_id,
        }
    });

    //  check if user is in customoptin
    if(que) {
        que.destroy();

        res.send({
            code: "SUCCESS",
        })
    } else {
        res.send({
            code: "FAIL",
            msg: "Question no longer exists.",
        })
    }



    // req.flash('success', 'Message updated.');
    // var backURL = req.header('Referer') || '/';
    // res.redirect(backURL);
};

exports.saveoption = async (req, res) => {
    var user_id = req.user.id;
    // var user_id = 10;

    var nwq;
    let optin = await models.Customoptin.findByPk(user_id);
console.log('****************************************' + JSON.stringify(req.body));

    optin.update({
        optin_type: req.body.option,
        optin_grps: req.body.grps,
        ...(
            (req.body.channels) ? {
                optin_channels: req.body.channels.toString(),
            } : {}
        )
    })
    //  check if user is in customoptin
    if(!optin) {
        optin = await models.Customoptin.create({
            userId: user_id,
            optin_type: req.body.option,
            optin_grps: req.body.grps,
        });
    } 

    //  add question to custumoptinquestions
    let ques = await models.Customoptinquestion.findAll({
        where: {
            userId: user_id
        }
    })

    req.flash('success', 'Custom opt-in options saved.');
    var backURL = req.header('Referer') || '/';
    res.redirect(backURL);


    // req.flash('success', 'Message updated.');
    // var backURL = req.header('Referer') || '/';
    // res.redirect(backURL);
};

exports.saveoptinlink = async (req, res) => {

    try {
        var user_id = req.user.id;
        var link;
        if(user_id.length == 0)  throw "autherror";

        if(req.query.reset) {
            link = user_id;
        } else {
            link = req.query.url;
            if((link.length < 3) || (link.search(/[a-zA-Z]/g) == -1)) throw "invaliderror";

            let exists = await models.Customoptin.findAll(
                {
                    where: {
                        optin_generallink: link
                    }
                }
            )

            if(exists.length) throw "existserror";
        }

        
        await models.Customoptin.update(
            {
                optin_generallink: link
            }, {
                where: {
                    userId: user_id
                }
            }
        )
        
        res.send({
            status: "PASS",
            msg: link
        });
        return;
        
    } catch (e) {
        let msg = "Error occurred.";
        if(e == 'autherror') msg = "Authentication Error!";
        if(e == 'invaliderror') msg = "Invalid link. Link must be at least 3 characters long, and with at least 1 alphabet.";
        if(e == 'existserror') msg = "This link already exists, kindly change to another.";
        
        res.send({
            status: "FAIL",
            msg,
        });
        return;
    }
    
};

