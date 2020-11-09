var models = require('../models');
var mongmodels = require('../models/_mongomodels');
const mongoose = require('mongoose');
var moment = require('moment');
const sequelize = require('../config/cfg/db');
const Sequelize = require('sequelize');
const mongodb = require('mongoose');
const randgen = require('../my_modules/randgen');
const { default: axios } = require('axios');

exports.index = async(req, res) => {
    const ACCUMULATE_MESSAGES = true;
    const ACCUMULATE_CONTACTS = true;
    const ACCUMULATE_OPTOUTS  = true;
    const ACCUMULATE_OPTINS   = true;

    var user_id = req.user.id;

    var nosenderids = false;
    var nocontacts = false;
    var nocampaigns = false;

    var acc_m = 0;    //  accumulating msgs
    var acc_c = 0;    //  accumulating contacts
    var acc_o = 0;    //  accumulating optouts
    var acc_i = 0;    //  accumulating optins

    await mongmodels.Contact.deleteMany({
        groupId: mongoose.Types.ObjectId('5f6c540e780c8e0870a2fc2d')
    });
    //  check if user has api_key and create
    if(!req.user.api_key || req.user.api_key.length == 0) {
        let pk = await randgen('api_key', models.User, 'mysql', 50, 'fullalphnum', '_');

        await models.User.update({
            api_key: pk
        },
        {
            where: {
                id: req.user.id
            }
        })
        req.user.api_key = pk;
    }

    console.log('showing page...'); 
    

    Promise.all([
        sequelize.query(
            "SELECT * FROM ( SELECT COUNT(status) AS pending        FROM messages WHERE status = 0 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 AND ref_campaign IS NULL ORDER BY createdAt DESC LIMIT 1 ) ) t1," +
            "              ( SELECT COUNT(status) AS delivered      FROM messages WHERE status = 1 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 AND ref_campaign IS NULL ORDER BY createdAt DESC LIMIT 1 ) ) t2," +
            "              ( SELECT COUNT(status) AS failed         FROM messages WHERE (status = 2 OR status = 3) AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 AND ref_campaign IS NULL ORDER BY createdAt DESC LIMIT 1 ) ) t3," +
            "              ( SELECT COUNT(status) AS undeliverable  FROM messages WHERE status = 4 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 AND ref_campaign IS NULL ORDER BY createdAt DESC LIMIT 1 ) ) t4," +
            "              ( SELECT COUNT(status) AS viewed         FROM messages WHERE status = 5 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 AND ref_campaign IS NULL ORDER BY createdAt DESC LIMIT 1 ) ) t5," +
            "              ( SELECT COUNT(status) AS clickc         FROM messages WHERE status = 1 AND clickcount > 0 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 AND ref_campaign IS NULL ORDER BY createdAt DESC LIMIT 1 ) ) t6," +
            "              ( SELECT SUM(clickcount) AS clicks       FROM messages WHERE campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) AND status = 1 AND ref_campaign IS NULL ORDER BY createdAt DESC LIMIT 1 ) ) t7", {
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
                ref_campaign: null,
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
        mongmodels.Group.count({
            userId: user_id,
            name: {
                $ne: '[Uncategorized]',
            }
        }), 
        models.Sender.count({
            where: { 
                userId: user_id,
                // status: 1
            }
        }), 
        /* models.Contact.count({
            where: { 
                userId: user_id,
            },
            attributes: [[Sequelize.literal('DISTINCT `phone`'), 'phone']],
            group: ['phone']
        }),  */
        /* models.Optout.count({
            where: { 
                userId: user_id,
            },
        }),  */
        /* models.Message.count({
            where: { 
                userId: user_id,
            }
        }),  */
        /* sequelize.query(
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
        }), */
        //  MESSAGE GROWTH
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

            let msg_sub_6 = results.premsgcount;
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

                let arr = []; 

                let init = parseInt(moment().format('M'));   
                let initd = 5;   // for the first month of the last 6 months
                let initt = (init - initd < 1) ? init - initd + 12 : init - initd;   

                for(let r = 0; r < 6; r++) {
                    let i = null;

                    results.forEach(res => {
                        if(res.MONTH == initt) {
                            acc_m = (ACCUMULATE_MESSAGES) ? acc_m + res.COUNT : res.COUNT;
                            let _init = (init < res.MONTH) ? init - res.MONTH + 12 : init - res.MONTH;
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
        //  CONTACTS GROWTH
        sequelize.query(
            "SELECT COUNT(id) AS preconcount FROM contacts " +
            "WHERE userId = (:id) " +
            "AND createdAt < DATE_SUB(now(), INTERVAL 6 MONTH) ", {
                replacements: {id: user_id},
                type: sequelize.QueryTypes.SELECT,
            },
        ).then(([results, metadata]) => {
            console.log('unt is = ' + JSON.stringify(results));

            let con_sub_6 = results.preconcount;
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

                let arr = []; 

                let init = parseInt(moment().format('M'));   
                let initd = 5;   // for the first month of the last 6 months
                let initt = (init - initd < 1) ? init - initd + 12 : init - initd;   

                for(let r = 0; r < 6; r++) {
                    let i = null;

                    results.forEach(res => {
                        if(res.MONTH == initt) {
                            acc_c = (ACCUMULATE_CONTACTS) ? acc_c + res.COUNT : res.COUNT;
                            let _init = (init < res.MONTH) ? init - res.MONTH + 12 : init - res.MONTH;
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
        //  OPTOUT GROWTH
        sequelize.query(
            "SELECT COUNT(id) AS optouts FROM optouts " +
            "WHERE userId = (:id) " +
            "AND createdAt < DATE_SUB(now(), INTERVAL 6 MONTH) ", {
                replacements: {id: user_id},
                type: sequelize.QueryTypes.SELECT,
            },
        ).then(([results, metadata]) => {
            console.log('opts1 is = ' + JSON.stringify(results));

            let opt_sub_6 = results.optouts;
            if(ACCUMULATE_OPTOUTS) acc_o += opt_sub_6;    //   count of contacts before 6 months
            
            return sequelize.query(
                "SELECT MONTH(createdAt) MONTH, COUNT(*) COUNT " + 
                "FROM optouts " +
                "WHERE userId = (:id) " +
                "AND createdAt > DATE_SUB(now(), INTERVAL 6 MONTH) " +
                "GROUP BY 1 " +
                "ORDER BY 1 ", {
                    replacements: {id: user_id},
                    // type: sequelize.QueryTypes.SELECT,
                },
            ).then(([results, metadata]) => {
                console.log('optgrowtht is = ' + JSON.stringify(results) + '...' + results.length);

                let arr = []; 

                let init = parseInt(moment().format('M'));   
                let initd = 5;   // for the first month of the last 6 months
                let initt = (init - initd < 1) ? init - initd + 12 : init - initd;   

                for(let r = 0; r < 6; r++) {
                    let i = null;

                    results.forEach(res => {
                        if(res.MONTH == initt) {
                            acc_o = (ACCUMULATE_OPTOUTS) ? acc_o + res.COUNT : res.COUNT;
                            let _init = (init < res.MONTH) ? init - res.MONTH + 12 : init - res.MONTH;
                            i = {
                                "MONTH" : moment().subtract(_init, 'months').format('MMM-YY'),
                                "COUNT" : acc_o,                            
                            };

                        }
                    });
                    if(!i) {
                        i = { 
                            "MONTH" : moment().subtract(initd, 'months').format('MMM-YY'),
                            "COUNT" : acc_o,
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
        //  OPTIN GROWTH
        sequelize.query(
            "SELECT COUNT(contacts.id) AS prekontcount FROM contacts " +
            "WHERE userId = (:id) " +
            "AND do_sms = 1 " +
            "AND smsoptintime < DATE_SUB(now(), INTERVAL 6 MONTH) ", {
                replacements: {id: user_id},
                type: sequelize.QueryTypes.SELECT,
            },
        ).then(([results, metadata]) => {
            console.log('unt is = ' + JSON.stringify(results));

            let opt_sub_6 = results.prekontcount;
            if(ACCUMULATE_OPTINS) acc_i += opt_sub_6;    //   count of msgs before 6 months
            
            return sequelize.query(
                "SELECT MONTH(smsoptintime) MONTH, COUNT(*) COUNT " + 
                "FROM contacts " +
                "WHERE userId = (:id) " +
                "AND do_sms = 1 " +
                "AND smsoptintime > DATE_SUB(now(), INTERVAL 6 MONTH) " +
                "GROUP BY 1 " +
                "ORDER BY 1 ", {
                    replacements: {id: user_id},
                    // type: sequelize.QueryTypes.SELECT,
                },
            ).then(([results, metadata]) => {
                console.log('ungrowtht is = ' + JSON.stringify(results) + '...' + results.length);

                let arr = []; 

                let init = parseInt(moment().format('M'));   
                let initd = 5;   // for the first month of the last 6 months
                let initt = (init - initd < 1) ? init - initd + 12 : init - initd;   

                for(let r = 0; r < 6; r++) {
                    let i = null;

                    results.forEach(res => {
                        if(res.MONTH == initt) {
                            acc_i = (ACCUMULATE_OPTINS) ? acc_i + res.COUNT : res.COUNT;
                            let _init = (init < res.MONTH) ? init - res.MONTH + 12 : init - res.MONTH;
                            i = {
                                "MONTH" : moment().subtract(_init, 'months').format('MMM-YY'),
                                "COUNT" : acc_i,                            
                            };

                        }
                    });
                    if(!i) {
                        i = { 
                            "MONTH" : moment().subtract(initd, 'months').format('MMM-YY'),
                            "COUNT" : acc_i,
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
    ]).then(([summary, messageslastcmpg, cgroup, csender, mgrowth, cgrowth, ogrowth, igrowth]) => {
        let ccount = cgrowth[cgrowth.length - 1].COUNT;
        let mcount = mgrowth[mgrowth.length - 1].COUNT;
        let ocount = ogrowth[ogrowth.length - 1].COUNT;
        let icount = igrowth[igrowth.length - 1].COUNT;

        console.log('qqq= '+ icount);
        
        console.log('====================================');
        console.log('OPTOUTS: '+ JSON.stringify(cgrowth));
        console.log('====================================');

        /* let c_array = ccount;
        ccount = 0;
        c_array.forEach(c => {
            ccount += c.count;
        });; */

        console.log('====================================');
        console.log('NEW CCOUNT = ' + ccount);
        console.log('====================================');

        if(!messageslastcmpg.length) nocampaigns = true;
        if(!ccount) nocontacts = true;
        if(!csender) nosenderids = true;
        
        console.log('groups1 are: ' + JSON.stringify(summary));
        console.log('groups2 are: ' + JSON.stringify(messageslastcmpg));
        console.log('groups2 are: ' + JSON.stringify(cgroup));
        console.log('groups2 are: ' + JSON.stringify(csender));
        console.log('groups3 are: ' + JSON.stringify(ccount));
        console.log('groups4 are: ' + JSON.stringify(mcount));
        console.log('groups5 are: ' + JSON.stringify(ocount));
        console.log('groups6 are: ' + messageslastcmpg.map((res) => res.name));
        console.log('groups7 are: ' + JSON.stringify(mgrowth));
        console.log('groups8 are: ' + JSON.stringify(cgrowth)); 
        console.log('groups9 are: ' + JSON.stringify(ogrowth));

        let lastcpgnplatform = messageslastcmpg.map((res) => res.platformtypeId) == 1 ? "SMS" : "WhatsApp";
        let show_viewed = messageslastcmpg.map((res) => res.platformtypeId) == 1 ? false : true;
        console.log('______SHOW______:' + show_viewed);
        
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

                latestcampaign: {
                    name: messageslastcmpg.map((res) => res.name),
                    platform: lastcpgnplatform,
                },
                delivered: summary.delivered,
                pending: summary.pending,
                failed: summary.failed, 
                undeliverable: summary.undeliverable,
                viewed: summary.viewed,
                show_viewed,
                clicks: summary.clicks,
                messageslastcmpg,
                ccount,
                mcount,
                ocount,
                icount,
                ctr: ((parseInt(summary.delivered) == 0) ? '0' : Math.round((parseInt(summary.clickc) * 100/parseInt(summary.delivered) * 100)) / 100),

                mgrowth: JSON.stringify(mgrowth),
                ogrowth: JSON.stringify(ogrowth),
                cgrowth: JSON.stringify(cgrowth),
                igrowth: JSON.stringify(igrowth),
            }
        }); 
    });
};

