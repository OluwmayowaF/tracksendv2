const sequelize = require('../config/cfg/db');
var models = require('../models');

exports.index = (req, res) => {
    var user_id = req.user.id;

    console.log('showing page...'); 
    // var flash = req.flash('success')
    // console.log('flash details are now: ' + flash); 

    sequelize.query(
        "SELECT " + 
        "   *, " +
        "   (SELECT `name` FROM `campaigns` t1 WHERE t1.`shortlinkId` = tt.`id` ORDER BY createdAt DESC LIMIT 1) AS cmpgn, " + 
        "   (SELECT COUNT(`clickcount`) FROM `messages` t2 WHERE t2.`shortlinkId` = tt.id) AS clicks " +
        "FROM `shortlinks` tt " +
        "WHERE tt.`userId` = 10 " +
        "AND tt.`status` = 1", {
            replacements: {
                uid: user_id,
            },
            type: sequelize.QueryTypes.SELECT,
        },
    )
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
    .then((sids) => {
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

    } catch(err) {
        console.log('2BIG ERROR: ' + err);
    }

    var backURL = req.header('Referer') || '/';
    res.redirect(backURL);

};
