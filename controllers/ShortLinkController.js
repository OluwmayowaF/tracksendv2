const sequelize = require('../config/cfg/db');
var models = require('../models');

exports.index = async (req, res) => {
    var user_id = req.user.id;

    console.log('showing page...'); 
    // var flash = req.flash('success')
    // console.log('flash details are now: ' + flash); 

    /* var sids =  await sequelize.query(
        "SELECT " + 
        "   *, " +
        "   (SELECT `name` FROM `campaigns` t1 WHERE t1.`shortlinkId` = tt.`id` ORDER BY createdAt DESC LIMIT 1) AS cmpgn, " + 
        "   (SELECT SUM(`clickcount`) FROM `messages` t2 WHERE t2.`shortlinkId` = tt.id) AS clicks " +
        "FROM `shortlinks` tt " +
        "WHERE tt.`userId` = :uid " +
        "AND tt.`status` = 1 " +
        "ORDER BY tt.createdAt DESC ", {
            replacements: {
                uid: user_id,
            },
            type: sequelize.QueryTypes.SELECT,
        },
    ); */

    var sids =  await sequelize.query(
        "SELECT " + 
        "   tt.*, " +
        // "   IFNULL(t1.`name`, '[none]') cmpgn, " + 
        // "   MAX(t1.`createdAt`), " + 
        "   SUM(t2.`clickcount`) clicks, " +
        "   GROUP_CONCAT(DISTINCT t1.`name` ORDER BY t1.`createdAt` SEPARATOR ', ') " +
        "FROM `shortlinks` tt " +
        "LEFT OUTER JOIN `campaigns` t1 " +
        "ON t1.`shortlinkId` = tt.`id` " +
        "LEFT OUTER JOIN `messages` t2 " +
        "ON t2.`campaignId` = t1.`id` " +
        "WHERE tt.`userId` = :uid " +
        "AND tt.`status` = 1 " +
        "GROUP BY tt.id " +
        "ORDER BY tt.createdAt DESC ", {
            replacements: {
                uid: user_id,
            },
            type: sequelize.QueryTypes.SELECT,
        },
    );

    /* var sids_ =  await sequelize.query(
        "SELECT " + 
        "   *, " +
        "   (SELECT `name` FROM `campaigns` t1 WHERE t1.`shortlinkId` = tt.`id` ORDER BY createdAt DESC LIMIT 1) AS cmpgn, " + 
        "   (SELECT SUM(`clickcount`) FROM `messages` t2 WHERE t2.`shortlinkId` = tt.id) AS clicks " +
        "FROM `shortlinks` tt " +
        "WHERE tt.`userId` = :uid " +
        "AND tt.`status` = 1 " +
        "ORDER BY tt.createdAt DESC ", {
            replacements: {
                uid: user_id,
            },
            type: sequelize.QueryTypes.SELECT,
        },
    ); */
    /* models.Shortlink.findAll({ 
        where: { 
            userId: user_id,
            status: 1
        },
        include: [{
            model: models.Campaign, 
            limit: 1,
            order: [ 
                ['createdAt', 'DESC']
            ],
            attributes: ['id', 'name'],
            // through: { }
        },{
            model: models.Message, 
            attributes: ['clickcount'],
            // through: { }
        }], 
        order: [    
            // ['status', 'DESC'],
            ['createdAt', 'DESC']
        ]
    }) */

    console.log('groups are: ' + JSON.stringify(sids));
    var flashtype, flash = req.flash('error');
    if(flash.length > 0) { 
        flashtype = "error";           
    } else {
        flashtype = "success";
        flash = req.flash('success');
    }

    res.render('pages/dashboard/shortlinks', {
        page: 'Short URLs',
        shortlinks: true,
        flashtype, flash,

        args: {
            sids: sids,
        }
    });
    
};


exports.add = async (req, res) => {
    var user_id = req.user.id;

    console.log('form details are now...'); 
    console.log('form details are now: ' + JSON.stringify(req.body)); 

    let sid = req.body.shorturlid;
    let url = req.body.myshorturl;

    try { 
        await models.Shortlink.update(
            {
                shorturl: url,
                status: 1,
            },
            {
                where: {
                    id: sid,
                    userId: user_id,
                }
            }
        );
        req.flash('success', 'Short URL created successfully.');

    } catch(err) {
        console.error('2BIG ERROR: ' + err);
        if(err.name == 'SequelizeUniqueConstraintError')  {
            req.flash('error', 'Sorry, the customized URL already exists.');
        }
    }

    var backURL = req.header('Referer') || '/';
    res.redirect(backURL);

};


exports.details = async (req, res) => {
    var user_id = req.user.id;

    let sid = req.params.id;
    console.log('showing page...'); 
    var sids =  await sequelize.query(
        "SELECT " + 
        "   tt.*, " +
        "   t1.referer referer, " +
        "   COUNT(t1.id) rcount " +
        "FROM `shortlinks` tt " +
        "LEFT OUTER JOIN `linkreferers` t1 " +
        "ON t1.`shortlinkId` = tt.`id` " +
        "WHERE tt.`userId` = :uid " +
        "AND tt.`id` = :sid " +
        "GROUP BY t1.referer " +
        "ORDER BY rcount DESC ", {
            replacements: {
                uid: user_id,
                sid: sid, 
            },
            type: sequelize.QueryTypes.SELECT,
        },
    );


    console.log('groupees are: ' + JSON.stringify(sids));
    
    var flashtype, flash = req.flash('error');
    if(flash.length > 0) { 
        flashtype = "error";           
    } else {
        flashtype = "success";
        flash = req.flash('success');
    }

    res.render('pages/dashboard/shortlink', {
        page: 'Short URLs',
        shortlinks: true,
        flashtype, flash,

        args: {
            clickcount: sids[0].clickcount,
            ctr: '100',
            sids,
        }
    });
    
};

