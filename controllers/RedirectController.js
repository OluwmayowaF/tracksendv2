const Sequelize = require('sequelize');
const moment = require('moment');
var models = require('../models');

exports.campaign = async function(req, res) {

    console.log('====================================');
    console.log('entry1');
    console.log('====================================');
    var surl = req.params.surl;
    var curl = req.params.curl;
    var seencmpgn = false;

    console.log('we show: surl = ' + surl + '; curl = ' + curl);
    console.log('1. we show: surl = ' + surl + 'headers.referer = ' + req.headers.referer);
    console.log('2. we show: surl = ' + surl + 'headers.referer = ' + req.header('Referer'));

    var shurl = await models.Shortlink.findOne({
        where: { 
            shorturl: surl,
        },
        // attributes: 
    });

    if(shurl == null) {
        console.log('ERROR IN SHURL: ' + JSON.stringify(shurl));
        
        res.render('pages/redirect-error', {
            page: '',
    
        });
        return;
    }

    var pro = await Promise.all([
        shurl.getMessages({
            where: {
                contactlink: curl,
            }
        }),
        shurl.update({
            clickcount: Sequelize.literal('clickcount + 1'),
        })
    ]);
    
    if(pro[0].length == 0) {
        // console.log('ERROR IN MSG' + JSON.stringify(msg));
        
        res.render('pages/redirect-error', {
            page: '',
    
        });
        return;
    }
    console.log('this is: ' + JSON.stringify(pro));
    
    //  update msg clicks and date (if first time)
    var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    await pro[0][0].update({
        clickcount: Sequelize.literal('clickcount + 1'),
        ...((pro[0][0].firstclicktime == null) ? {firstclicktime: mysqlTimestamp} : {})
    })

    //  finally, redirect to client URL
    let utm = '';
    
    var cmpgn = await models.Campaign.findByPk((pro[0][0].campaignId), {
        attributes: ['name','has_utm'], 
    })
    console.log('pre-utm-check; cid = ' + cmpgn.has_utm + ' -- ' + JSON.stringify(cmpgn));
    if(cmpgn.has_utm) {
        console.log('post-utm-check');
        //   seencmpgn = true;
        utm = '?utm_source=tracksend&utm_medium=sms&utm_campaign=' + cmpgn.name;
    }

   /*  var ssh = await shurl.getMessages({
        where: {
            contactlink: curl,
        }
    });

    console.log('================ssh====================');
    console.log(JSON.stringify(ssh));
    console.log('====================================');

    var shh = await models.Shortlink.findOne({
        where: { 
            shorturl: surl,
        },
        // attributes: 
    });

    console.log('===============shh=====================');
    console.log(JSON.stringify(shh));
    console.log('===================================='); */

    res.redirect(shurl.url + utm);

};

exports.browser = async function(req, res) {


    console.log('====================================');
    console.log('entry2');
    console.log('====================================');
    var surl = req.params.surl;
    var cmpgn;

    console.log('1. we show: surl = ' + surl + 'headers.referer = ' + req.headers.referer);
    console.log('2. we show: surl = ' + surl + 'headers.referer = ' + req.header('Referer'));
    
    var shurl = await models.Shortlink.findOne({
            where: { 
                shorturl: surl,
            }
    });

    if(shurl == null) {
        console.log('ERROR IN SHURL: ' + JSON.stringify(shurl));
        
        res.render('pages/redirect-error', {
            page: '',
    
        });
        return;
    } else {
        await shurl.update({
            clickcount: Sequelize.literal('clickcount + 1'),
        });

        //  track referer
        const refererlist = [
            /facebook.com/,
            /instagram.com/,
            /twitter.com/,
            /linkedin.com/,
            /pinterest.com/,
        ];
          
        let referer = req.headers.referer;// 'https://www.facebook.com';//req.headers.referer;
        let ref_ = /other/;
        refererlist.some(rx => {
        if(rx.test(referer)) ref_ = rx;
        });

        let ref = (new RegExp(ref_)).source;
        console.log('referer = ' + ref);

        //    and store in db
        models.Linkreferer.create({
            shortlinkId: shurl.id,
            referer: ref,
        })

        res.redirect(shurl.url);
    }

};

exports.redirect = function(req, res) {
    console.log('just redirecting...');
    
    res.redirect('https://tracksend.co');

};

exports.error = function(req, res) {
    console.log('error page q');
    
    res.render('pages/redirect-error', {
        page: '',

    });

};

