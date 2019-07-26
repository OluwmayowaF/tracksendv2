var models = require('../models');
var moment = require('moment');
const sequelize = require('../config/db');

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
            "SELECT * FROM ( SELECT COUNT(status) AS pending        FROM messages WHERE status = 0 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) ORDER BY createdAt DESC LIMIT 1 ) ) t1," +
            "              ( SELECT COUNT(status) AS delivered      FROM messages WHERE status = 1 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) ORDER BY createdAt DESC LIMIT 1 ) ) t2," +
            "              ( SELECT COUNT(status) AS failed         FROM messages WHERE status = 2 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) ORDER BY createdAt DESC LIMIT 1 ) ) t3," +
            "              ( SELECT COUNT(status) AS undeliverable  FROM messages WHERE status = 3 AND campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) ORDER BY createdAt DESC LIMIT 1 ) ) t4," +
            "              ( SELECT SUM(clickcount) AS clicks       FROM messages WHERE campaignId = ( SELECT id FROM campaigns WHERE userId = (:id) ORDER BY createdAt DESC LIMIT 1 ) ) t5", {
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
            }
        }), 
        /* models.Message.count({
            where: { 
                userId: user_id,
            }
        }),  */
        sequelize.query(
            "SELECT COUNT(messages.id) AS msgcount FROM messages " +
            "JOIN campaigns ON messages.campaignId = campaigns.id " +
            "WHERE campaigns.userId = (:id) ", {
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
        
        
        if(!messages.length) nocampaigns = true;
        if(!cgroup) nocontacts = true;
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

        res.render('pages/dashboard/dashboard', { 
            page: 'Dashboard',
            dashboard: true,
            flash: req.flash('success'),

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
                ctr: ((parseInt(summary.delivered) == 0) ? '0' : (parseInt(summary.clicks) * 100/parseInt(summary.delivered))),

                mgrowth: JSON.stringify(mgrowth),
                cgrowth: JSON.stringify(cgrowth),
            }
        }); 
    });
};

