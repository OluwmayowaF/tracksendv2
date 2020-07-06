const Sequelize = require('sequelize');
const moment = require('moment');
var models = require('../models');
const getUrlReferer = require('../my_modules/getUrlReferer');
// const referrer = require('referrer');

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

    getUrlReferer(req, shurl.id);
    
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

    console.log('______shurl.url=', shurl.url);
    console.log('______utm=', utm);

    // NEXT IMPOSE 'HTTP' ON URL. IF ABSENT
    let url_ = shurl.url;
    url_ = (url_.substr(0, 7) == 'http://' || url_.substr(0, 8) == 'https://') ? url_ : 'http://' + url_;
    res.redirect(url_ + utm);
    // location.replace(shurl.url + utm);


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

        getUrlReferer(req, shurl.id);          

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

