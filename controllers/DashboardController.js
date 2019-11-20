var models = require('../models');
var moment = require('moment');
const sequelize = require('../config/cfg/db');
const Sequelize = require('sequelize');

exports.index = (req, res) => {
    const ACCUMULATE_MESSAGES = true;
    const ACCUMULATE_CONTACTS = true;

    var user_id = req.user.id;

    var nosenderids = false;
    var nocontacts = false;
    var nocampaigns = false;

    var acc_m = 0;    //  accumulating msgs
    var acc_c = 0;    //  accumulating msgs


    console.log('showing page...'); 
    
    Promise.all([
        sequelize.query(
            "SELECT * FROM ( SELECT COUNT(status) AS pending        FROM messages WHERE status = 0 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 ORDER BY createdAt DESC LIMIT 1 ) ) t1," +
            "              ( SELECT COUNT(status) AS delivered      FROM messages WHERE status = 1 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 ORDER BY createdAt DESC LIMIT 1 ) ) t2," +
            "              ( SELECT COUNT(status) AS failed         FROM messages WHERE status = 2 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 ORDER BY createdAt DESC LIMIT 1 ) ) t3," +
            "              ( SELECT COUNT(status) AS undeliverable  FROM messages WHERE status = 3 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 ORDER BY createdAt DESC LIMIT 1 ) ) t4," +
            "              ( SELECT COUNT(status) AS clickc         FROM messages WHERE clickcount > 0 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 ORDER BY createdAt DESC LIMIT 1 ) ) t5," +
            "              ( SELECT SUM(clickcount) AS clicks       FROM messages WHERE campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 ORDER BY createdAt DESC LIMIT 1 ) ) t6", {
                replacements: {id: user_id},
                type: sequelize.QueryTypes.SELECT,
            }
        ).then(([results, metadata]) => {
            console.log(results);
            return results;
        }),
        /* models.Campaign.findAll({ 
            where: { 
                userId: user_id
            },
            order: [ 
                ['createdAt', 'DESC']
            ],
            limit: 1,
            include: [{
                model: models.Message, 
                attributes: ['id', 'name', 'nameKh'], 
                // through: { }
            }],
        }),  */
        models.Campaign.findAll({ 
            where: { 
                userId: user_id,
                status: 1,
            },
            include: [{
                model: models.Message, 
                limit: 5, 
                order: [ 
                    ['createdAt', 'DESC']
                ],
                // attributes: ['id', 'name', 'nameKh'],
                // through: { }
            }], 
            order: [ 
                ['createdAt', 'DESC']
            ],
            limit: 1,
        }), 
        models.Group.count({
            where: { 
                userId: user_id,
                name: {
                    [Sequelize.Op.ne]: '[Uncategorized]',
                }
            }
        }), 
        models.Sender.count({
            where: { 
                userId: user_id,
                // status: 1
            }
        }), 
        models.Contact.count({
            where: { 
                userId: user_id,
            },
            attributes: [[Sequelize.literal('DISTINCT `phone`'), 'phone']]
        }), 
        /* models.Message.count({
            where: { 
                userId: user_id,
            }
        }),  */
        sequelize.query(
            "SELECT COUNT(messages.id) AS msgcount FROM messages " +
            "JOIN campaigns ON messages.campaignId = campaigns.id " +
            "WHERE campaigns.userId = (:id) " +
            "AND campaigns.status = 1 ", {
                replacements: {id: user_id},
                type: sequelize.QueryTypes.SELECT,
            },
        ).then(([results, metadata]) => {
            console.log('unt is = ' + JSON.stringify(results));
           
            return results.msgcount;
        }),
        sequelize.query(
            "SELECT COUNT(messages.id) AS premsgcount FROM messages " +
            "JOIN campaigns ON messages.campaignId = campaigns.id " +
            "WHERE campaigns.userId = (:id) " +
            "AND campaigns.status = 1 " +
            "AND messages.createdAt < DATE_SUB(now(), INTERVAL 6 MONTH) ", {
                replacements: {id: user_id},
                type: sequelize.QueryTypes.SELECT,
            },
        ).then(([results, metadata]) => {
            console.log('unt is = ' + JSON.stringify(results));

            var msg_sub_6 = results.premsgcount;
            if(ACCUMULATE_MESSAGES) acc_m += msg_sub_6;    //   count of msgs before 6 months
            
            return sequelize.query(
                "SELECT MONTH(messages.createdAt) MONTH, COUNT(*) COUNT " + 
                "FROM messages " +
                "JOIN campaigns ON messages.campaignId = campaigns.id " +
                "WHERE campaigns.userId = (:id) " +
                "AND campaigns.status = 1 " +
                "AND messages.createdAt > DATE_SUB(now(), INTERVAL 6 MONTH) " +
                "GROUP BY 1 " +
                "ORDER BY 1 ", {
                    replacements: {id: user_id},
                    // type: sequelize.QueryTypes.SELECT,
                },
            ).then(([results, metadata]) => {
                console.log('ungrowtht is = ' + JSON.stringify(results) + '...' + results.length);

                var arr = []; 

                var init = parseInt(moment().format('M'));   
                var initd = 5;   // for the first month of the last 6 months
                var initt = (init - initd < 1) ? init - initd + 12 : init - initd;   

                for(var r = 0; r < 6; r++) {
                    var i = null;

                    results.forEach(res => {
                        if(res.MONTH == initt) {
                            acc_m = (ACCUMULATE_MESSAGES) ? acc_m + res.COUNT : res.COUNT;
                            var _init = (init < res.MONTH) ? init - res.MONTH + 12 : init - res.MONTH;
                            i = {
                                "MONTH" : moment().subtract(_init, 'months').format('MMM-YY'),
                                "COUNT" : acc_m,                            
                            };

                        }
                    });
                    if(!i) {
                        i = { 
                            "MONTH" : moment().subtract(initd, 'months').format('MMM-YY'),
                            "COUNT" : acc_m,
                        };
                    }
    console.log("results= "+ JSON.stringify(i));

                    arr.push(i)
                    initt = (initt + 1 > 12) ? initt + 1 - 12 : initt + 1;
                    initd--;
                };
                console.log('new array : ' +    JSON.stringify(arr));
                
                
                return arr;
            })  
        }),
        sequelize.query(
            "SELECT COUNT(id) AS preconcount FROM contacts " +
            "WHERE userId = (:id) " +
            "AND createdAt < DATE_SUB(now(), INTERVAL 6 MONTH) ", {
                replacements: {id: user_id},
                type: sequelize.QueryTypes.SELECT,
            },
        ).then(([results, metadata]) => {
            console.log('unt is = ' + JSON.stringify(results));

            var con_sub_6 = results.preconcount;
            if(ACCUMULATE_CONTACTS) acc_c += con_sub_6;    //   count of contacts before 6 months
            
            return sequelize.query(
                "SELECT MONTH(createdAt) MONTH, COUNT(*) COUNT " + 
                "FROM contacts " +
                "WHERE userId = (:id) " +
                "AND createdAt > DATE_SUB(now(), INTERVAL 6 MONTH) " +
                "GROUP BY 1 " +
                "ORDER BY 1 ", {
                    replacements: {id: user_id},
                    // type: sequelize.QueryTypes.SELECT,
                },
            ).then(([results, metadata]) => {
                console.log('cungrowtht is = ' + JSON.stringify(results) + '...' + results.length);

                var arr = []; 

                var init = parseInt(moment().format('M'));   
                var initd = 5;   // for the first month of the last 6 months
                var initt = (init - initd < 1) ? init - initd + 12 : init - initd;   

                for(var r = 0; r < 6; r++) {
                    var i = null;

                    results.forEach(res => {
                        if(res.MONTH == initt) {
                            acc_c = (ACCUMULATE_CONTACTS) ? acc_c + res.COUNT : res.COUNT;
                            var _init = (init < res.MONTH) ? init - res.MONTH + 12 : init - res.MONTH;
                            i = {
                                "MONTH" : moment().subtract(_init, 'months').format('MMM-YY'),
                                "COUNT" : acc_c,                            
                            };

                        }
                    });
                    if(!i) {
                        i = { 
                            "MONTH" : moment().subtract(initd, 'months').format('MMM-YY'),
                            "COUNT" : acc_c,
                        };
                    }
    console.log("results= "+ JSON.stringify(i));

                    arr.push(i)
                    initt = (initt + 1 > 12) ? initt + 1 - 12 : initt + 1;
                    initd--;
                };
                console.log('new array : ' +    JSON.stringify(arr));
                
                
                return arr;
            })  
        }),
    ]).then(([summary, messages, cgroup, csender, ccount, mcount, mgrowth, cgrowth]) => {
        console.log('qqq= '+messages.length);
        
        console.log('====================================');
        console.log('CGROUP: '+ ccount);
        console.log('====================================');
        if(!messages.length) nocampaigns = true;
        if(!ccount) nocontacts = true;
        if(!csender) nosenderids = true;
        
        console.log('groups1 are: ' + JSON.stringify(summary));
        console.log('groups2 are: ' + JSON.stringify(messages));
        console.log('groups2 are: ' + JSON.stringify(cgroup));
        console.log('groups2 are: ' + JSON.stringify(csender));
        console.log('groups3 are: ' + JSON.stringify(ccount));
        console.log('groups4 are: ' + JSON.stringify(mcount));
        console.log('groups8 are: ' + messages.map((res) => res.name));
        console.log('groups9 are: ' + JSON.stringify(mgrowth));
        console.log('groups10 are: ' + JSON.stringify(cgrowth));

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/dashboard', { 
            page: 'Dashboard',
            dashboard: true,
            flashtype, flash,

            args: {
                nosenderids: nosenderids,
                nocontacts: nocontacts,
                nocampaigns: nocampaigns,

                latestcampaign: messages.map((res) => res.name),

                delivered: summary.delivered,
                pending: summary.pending,
                failed: summary.failed, 
                undeliverable: summary.undeliverable,
                clicks: summary.clicks,
                messages,
                ccount,
                mcount,
                ctr: ((parseInt(summary.delivered) == 0) ? '0' : (parseInt(summary.clickc) * 100/parseInt(summary.delivered))),

                mgrowth: JSON.stringify(mgrowth),
                cgrowth: JSON.stringify(cgrowth),
            }
        }); 
    });
};

exports.manualget = (req, res) => {
    var user_id = req.user.id;

    models.Topup.findAll({ 
        include: [{
            model: models.Payment, 
            // attributes: ['id', 'name', 'nameKh'], 
            where: { 
                channel: "manual"
            }
        },
        {
            model: models.User, 
            attributes: ['id', 'name'], 
        }],
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then((tups) => {

        models.Settingstopuprate.findAll({
            order: [ 
                ['id', 'ASC']
            ]
        })
        .then((rates) => {

            console.log('====================================');
            console.log(JSON.stringify(tups));
            console.log('====================================');
            
            var flashtype, flash = req.flash('error');
            if(flash.length > 0) {
                flashtype = "error";           
            } else {
                flashtype = "success";
                flash = req.flash('success'); 
            }

            res.render('pages/dashboard/manual_topup', {
                page: 'TopUps', 
                topups: true,
                flashtype, flash,

                args: {
                    tups,
                    rates,
                }
            });
        })

        

    })

};

exports.manualpost = async (req, res) => {

    let uid = req.user.id;
    let cid = req.body.clientid;
    let amt = req.body.amount;
    // let rid = req.body.rateid;
    try {
        let client = await models.User.findByPk(cid);

        let payt = await models.Payment.create({
            paymentref: "Manual_By_" + uid,
            userId: client.id,
            name: client.name,
            phone: client.phone,
            email: client.email,
            amount: amt,
            channel: 'manual',
            isverified: 1,
        })

        let getUnits = async(amt) => {
            var rate = await models.Settingstopuprate.findAll({
                order: [ 
                    ['id', 'ASC']
                ]
            });
            console.log('111111111 -> ' + amt);
            
            let owo = parseInt(amt);
            var units = 0;
            let rid = 0;
            var drate = 0;
            rate.forEach(el => {
                console.log('trying...');
                
                if(owo >= el.lowerlimit && owo <= el.upperlimit) {
                    console.log('got it!');
                    
                    drate = el.amount;
                    rid = el.id;
                }
            });
            if(drate != 0) {
                console.log('moving on...');
                
                units = Math.floor(owo/drate);
            } 

            return {
                units,
                rid,
            }

        }
        
        let gettr = await getUnits(amt);
        console.log('====================================');
        console.log(gettr);
        console.log('====================================');
        let units = gettr.units;
        let rateid = gettr.rid;
        
        if(rateid === 0) {
            console.log('====================================');
            console.log('error in amount');
            console.log('====================================');
        }

        let topup = await models.Topup.create({
            userId: client.id,
            settingstopuprateId: rateid,
            amount: amt,
            units,
            paymentId: payt.id,
        })

        let trx = await models.Transaction.create({
            description: 'CREDIT',
            amount: amt,
            trxref: "Manual_By_" + uid,
            units,
            userId: client.id,
            status: 1, 
            type: 'MANUAL_TOPUP',
            ref_id: topup.id,
        })

        await client.update({
            balance: Sequelize.literal('balance + ' + units),
        });

        req.flash('success', "Manual TopUp Successful");
        res.redirect('/dashboard/m_a_n_u_a_l');
        

    } catch(err) {
        console.log(err);
        console.log('errorerr = ' + err);
        
        if(err.name == 'SequelizeUniqueConstraintError') {
            req.flash('error', 'Group Name already exists on your account.');
        } else if (err == "Invalid" ) {
            req.flash('error', "Invalid Phone Number");
        } else if (err == "Duplicate" ) {
            req.flash('error', "Duplicate Phone Number");
        }
        var backURL = req.header('Referer') || '/';
        res.redirect(backURL);
    };


    console.log('showing page...'); 
    
};

