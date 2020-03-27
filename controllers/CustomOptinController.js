var models = require('../models');

// const { default: axios } = require('axios');
// const { INSTANCEID, TOKEN , BINURL } = require('../config/cfg/chatapi')();

exports.index = async (req, res) => {
    const Sequelize = require('sequelize');
    var user_id = req.user.id;

    let msgs = await models.Customoptin.findByPk(user_id);
    let msg_1, msg_2

    console.log('====================================');
    console.log('sgs= ' + JSON.stringify(msgs));
    console.log('====================================');

    if(msgs) {
        msg_1 = msgs.optin_msg1 || null;
        msg_2 = msgs.optin_msg2 || null;
    }

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
    ]).then(([grps, opt, ques]) => {
        if(grps) {
            grps = grps.map(g => {
                let arr = opt.optin_grps ? opt.optin_grps.split(',') : [];
                g.selected = (arr.includes(g.id.toString())) ? true : false;
                
                return g;
            });
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
                option_two_click: opt.optin_type == 'two-click' ? true : false,
                option_complete: opt.optin_type == 'complete' ? true : false,
                ques, 
                msg_1, 
                msg_2
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
    let optin_msg_1 = req.body.optin_msg1 || null;
    let optin_msg_2 = req.body.optin_msg2 || null;

    console.log('====================================');
    console.log('sgs= ' + JSON.stringify(msgs));
    console.log('====================================');

    if(msgs) {
        await msgs.update({
            ...(
                optin_msg_1 ? {
                    optin_msg_1
                } : {
                    optin_msg_2
                }
            )
        })
    } else {
        await models.Customoptin.create({
            userId: user_id,
            ...(
                optin_msg_1 ? {
                    optin_msg_1
                } : {
                    optin_msg_2
                }
            )
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

