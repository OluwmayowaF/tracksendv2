var models = require('../models');
var moment = require('moment');
const Sequelize = require('sequelize');
const sequelize = require('../config/cfg/db');
const mongoose = require('mongoose');
var mongmodels = require('../models/_mongomodels');
var scheduler = require('node-schedule');
var mgauth = require('../config/cfg/mailgun')();
const mailgun = require('mailgun-js')({apiKey: mgauth.APIKEY, domain: mgauth.DOMAIN});

var smsSendEngines = require('../my_modules/sms/smsSendEngines');


exports.index = async (req, res) => {
    var user_id = req.user.id;
    // var user_id = 10;
    
    console.log('....................showing page......................'); 

    Promise.all([
        mongmodels.PerfCampaign.find({     //  get all pending perf campaigns
            userId: user_id,
        })
        .sort({
            "createdAt": -1
        }),
        models.Sender.findAll({     //  get all sender ids for display in form
            where: { 
                userId: user_id,
                status: 1
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }), 
        models.Shortlink.findAll({ 
            where: { 
                userId: user_id,
                status: 1
            },
            order: [    
                // ['status', 'DESC'],
                ['createdAt', 'DESC']
            ]
        }),    
    ]).then(async ([pcpns, sids, shorturl]) => {


        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        // res.render('pages/dashboard/whatsappcompleteoptin', { 
        res.render('pages/dashboard/perfcampaigns', { 
            page: 'Performance Campaigns',
            campaigns: true,
            pcampaigns: true,
            campaign_type: '',
            // has_whatsapp: status.active,
            flashtype, flash,

            args: {
                pcpns,
                sids,
                shorturl,
            }
        });
    });
};

exports.analyse = async (req, res) => {

}

exports.add = async (req, res) => {
    var user_id = req.user.id;
    // var user_id = 10;
    let form = req.body;
    var _status;

    try {
        let reqs = form.pc_criteria;
        reqs = Array.isArray(reqs) ? reqs : [ reqs ];
        let reqlist = [];
        reqs.forEach(r => {
            // reqlist.push({ [r]: Array.isArray(form['pc_target_' + r]) ? form['pc_target_' + r] : [form['pc_target_' + r]] })
            let cc = getRealName(r);
            let tt = form['pc_target_' + r];
            let _target = Array.isArray(tt) ? 
                            tt.map(t => { return (typeof t == "string") ? t.trim().toLowerCase() : t }) : 
                            ( (typeof tt == "string") ?  
                                tt.split(',').map(t => { return (typeof t == "string") ? t.trim().toLowerCase() : t }) : 
                                [ tt ]
                            );

            reqlist.push({ 
                criteria: cc, 
                target: _target     // Array.isArray(form['pc_target_' + r]) ? form['pc_target_' + r] : [ form['pc_target_' + r ]] 
            })
        })


        console.log('________pcpgn data: ', JSON.stringify(form));
        if(form.name.length == 0) throw 'name';
        if(form.measure.length == 0) throw 'measure';
        if(form.sender.length == 0) throw 'sender';
        if(form.message.length == 0) throw 'message';
        if(reqlist.length == 0) throw 'criteria';
        if((form.budget == 0) || isNaN(parseFloat(form.budget))) throw 'budget';

        let newcampaign = await mongmodels.PerfCampaign.create({
            userId: user_id,
            name: form.name,
            type: form.type,
            measure: getRealName(form.measure),
            senderId: form.sender,
            message: form.message,
            conditionset: reqlist,
            budget: form.budget,
            shortlinkId: form.shorturl,
            startdate: form.datepicker,
            status: { stage: 'Pre-analyze', active: true },
            addoptin: (form.add_optin == "on") ? true : false,
        });

        var data = {
            from: 'Tracksend <info@tracksend.co>',
            to: 'admin@tracksend.co, ' + req.user.mail,
            subject: 'Tracksend: New Performance Campaign.',
            text: 'A new Performance Campaign called ' + form.name + ' has just been created by ' + req.user.name + ' (' + req.user.business + ').',
        };
        
        mailgun.messages().send(data, function (error, body) {
            console.log('mail error: ' + JSON.stringify(error));
            console.log('mail body: ' + JSON.stringify(body));
        });

        _status = {
            response: {
            }, 
            responseType: "SUCCESS", 
            responseCode: "OK", 
            responseText: "Campaign submitted for approval.", 
        }
    
        function getRealName(abrv) {
            let fn = abrv;
            switch (abrv) {
                case "loc":
                    fn = "Location";
                    break;
                case "age":
                    fn = "Age";
                    break;
                case "gdr":
                    fn = "Gender";
                    break;
                case "sts":
                    fn = "Status";
                    break;
                case "inc":
                    fn = "Income Class";
                    break;
                case "int":
                    fn = "Interests";
                    break;
                case "per_imp":
                    fn = "Per Impression";
                    break;
                case "per_clk":
                    fn = "Per Click";
                    break;
                default:
                    break;
            }
            return fn;
        }
    } catch(err) {
        console.log(err);
        let errmsg = 'Please specify ';

        switch (err) {
            case 'name':
                errmsg += "'Campaign Name', ";
                // break;
            case 'measure':
                errmsg += "'Measure', ";
                // break;
            case 'sender':
                errmsg += "'Sender ID', ";
                // break;
            case 'message':
                errmsg += "'Message', ";
                // break;
            case 'reqlist':
                errmsg += "'Criteria', ";
                // break;
            case 'budget':
                errmsg += "'Budget', ";
                break;
        
            default:
                break;
        }
        if( errmsg == 'Please specify ') {
        }
    
        _status = {
            response: "Input error", 
            responseType: "ERROR", 
            responseCode: "E000", 
            responseText: errmsg, 
        }

    }

    req.flash(_status.responseType.toLowerCase(), _status.responseText);
    var backURL = req.header('Referer') || '/';
    res.redirect(backURL);

}

exports.send = async (req, res) => {
    const PCMPGN_IMPRN_LIFESPAN_HOURS = 1; //24;
    const PCMPGN_IMPRN_INTR_INTVL_HOURS = 0.33; //3;

    const PCMPGN_CLICK_LIFESPAN_HOURS = 1.5; //72;
    const PCMPGN_CLICK_INTR_INTVL_HOURS = 0.5; //24;
    const PCMPGN_CLICK_EXPECTED_CTR = 0.05;
    const PCMPGN_CLICK_EXPECTED_DLVRY_RATE = 0.5;
    const PCMPGN_CLICK_ITERATION_VOLUMES = [0.5, 0.25, 0.25];
    const PCMPGN_CLICK_PRICE_PER_SMS = 2;

    const PCMPGN_AVG_COST_PER_UNIT = 2;

    let rmsg = "error"; //"Campaign successfully started.";

    req.perfcampaign = true; 
    
    try {
        var user_id = req.user.id;
        // var user_id = 10;
        var cid = req.query.id;
        var user_balance, sndr, info = null, schedule, schedule_, cpn, originalmessage, contacts;
        var UNSUBMSG = false, DOSUBMSG, SINGLE_MSG, HAS_SURL, is_api_access = false, aux_obj;

        var _status;
        var crit_gdr, crit_inc, crit_int, crit_sts, crit_loc, crit_age;

        //  GET USER BALANCE
        var user_balance_ = await models.User.findByPk(user_id, {
            attributes: ['balance'], 
            raw: true, 
        })
        user_balance = parseFloat(user_balance_.balance);

        cpn = await mongmodels.PerfCampaign.findOneAndUpdate({
            _id: mongoose.Types.ObjectId(cid),
        }, {
            "status.stage": "In-Process"
        })

        console.log('cpcnsdc = ' + JSON.stringify(cpn));
        if(cpn.status.stage != "Approved") throw 'not_approved';

        var budget = cpn.budget;
        var cost = cpn.cost;
        var units_used = Math.floor(parseFloat(budget) / parseFloat(cost)) * parseFloat(cost) / PCMPGN_AVG_COST_PER_UNIT;   //  to get the relevant portion of the budget

        /*  
            REMOVE UNITS AND 
            REGISTER/LOG TRANSACTION 
        */
        if(user_balance < units_used) throw 'insufficient_balance';

        let new_bal = user_balance - units_used;
        console.log('old bal = ' + user_balance + '; units used = ' + units_used + '; NEW BALANCE = ' + new_bal);

        //  UPDATE UNITS USER BALANCE
        await models.User.update({
            balance: new_bal,
        }, {
            where: { id: user_id },
        });

        //  LOG TRANSACTIONS (performance campaigns transactions are logged separately)
        await models.Transaction.create({
            description: 'DEBIT',
            userId: user_id,
            type: (req.txnmessaging) ? 'TXN-MESSAGING' : ((req.perfcampaign) ? 'PERFCAMPAIGN' : 'CAMPAIGN'),
            ref_id: (req.txnmessaging) ? new Date().getTime() : cpn.id.toString(),
            units: (-1) * units_used,
            status: 1,
        })


        /*  REMOVED UNITS AND REGISTERED/LOGGED TRANSACTION */


        sndr = await models.Sender.findByPk(cpn.senderId, { attributes: ['id', 'name']});
        originalmessage = cpn.message;
        // schedule = cpn.startdate;
        // utm = (req.body.add_utm && req.body.add_utm == "on");
        DOSUBMSG = (req.body.add_optin && req.body.add_optin == "on");
        HAS_SURL = (originalmessage.search(/\[url\]/g) !== -1) && cpn.shorturl;
        SINGLE_MSG = !HAS_SURL;

        info = {
            name: cpn.name,
            shortlinkId: cpn.shorturl,
            units_used,
        } 

        var crits = cpn.conditionset;
        crits.forEach(c => {
            // let crit = getApplicableName(c.criteria);
            switch (c.criteria) {
                case 'Age':
                    crit_age = c.target;
                    break;
                case 'Gender':
                    crit_gdr = c.target;
                    break;
                case 'Status':
                    crit_sts = c.target;
                    break;
                case 'Location':
                    crit_loc = c.target;
                    break;
                case 'Income Class':
                    crit_inc = c.target;
                    break;
                case 'Interests':
                    crit_int = c.target;
                    break;
            
                default:
                    break;
            }
        })

        var crit = {
            ...(crit_sts? {
                "fields.status": {
                    $in: crit_sts.map(i => { return i.toLowerCase() })
                },
            } : {}),
            ...(crit_age? {
                "fields.age": {
                    $in: listAges(crit_age)
                },
            } : {}),
            ...(crit_gdr? {
                "fields.gender": {
                    $in: crit_gdr.map(i => { return i.substr(0, 1).toUpperCase() })
                },
            } : {}),
            ...(crit_inc? {
                "fields.income": {
                    $in: crit_inc
                },
            } : {}),
            ...(crit_int? {
                "fields.interests": {
                    $in: crit_int.map(i => { return i.toLowerCase() })
                },
            } : {}),
            ...(crit_loc? { 
                "fields.location": {
                    $in: crit_loc
                },
            } : {}),
        }

        //  consider campaign type/measure!
        var measure = cpn.measure;
        const PCMPGN_LIFESPAN_HOURS   = (measure == "per_imp") ? PCMPGN_IMPRN_LIFESPAN_HOURS   : PCMPGN_CLICK_LIFESPAN_HOURS;
        const PCMPGN_INTR_INTVL_HOURS = (measure == "per_imp") ? PCMPGN_IMPRN_INTR_INTVL_HOURS : PCMPGN_CLICK_INTR_INTVL_HOURS;

        // var tgtcount = parseFloat(cpn.budget) / parseFloat(cpn.cost);
        // var dura = PCMPGN_LIFESPAN_HOURS * 60 * 60 * 1000, 
        // var iter = 0;
        
        // var _end = moment().add(PCMPGN_LIFESPAN_HOURS, 'hours');
        var _end = moment().add(PCMPGN_LIFESPAN_HOURS * 60, 'minutes');

        // perfEngine(0)
        (async function perfEngine( iter = 0, end = _end ) {

            //  get status of performance campaign
            let status_ = await mongmodels.PerfCampaign.findOne({
                _id: mongoose.Types.ObjectId(cid),
            }).select('status.stage')
            if((status_.status.stage != "Approved") && (status_.status.stage != "In-Process")) return;

            //  confirm/get valid timing and schedule
            let timing = _acceptableTime(end)
            if(timing == "end") return; //  update campaign to "finished"
            else if(timing != "now") scheduler.scheduleJob(timing, perfEngine.bind(iter, end));
            //  else, continue

            console.log('***********  PERFORMANCE CAMPAIGN ITERATION #' + iter + "  ************");
            //  update campaign status to "In-Process"
            await mongmodels.PerfCampaign.updateOne({
                _id: mongoose.Types.ObjectId(cid),
            }, {
                "status.stage": "In-Process"
            });

            contacts = await _extractContacts(iter, measure);
            if(!contacts || !contacts.length) return;
            console.log('FOUND _' + contacts.length + '_ CONTACTS');
            
            let result = await _doSMS(contacts);
            if(result == 'error') throw "error in result";

            // let next = moment().add(PCMPGN_INTR_INTVL_HOURS, 'hours').toDate();
            let next = moment().add(PCMPGN_INTR_INTVL_HOURS * 60, 'minutes').toDate();
            scheduler.scheduleJob(next, perfEngine.bind(iter++, end));
        })()

        async function _doSMS(_contacts) {
            let resp = await smsSendEngines(
                req, res,
                user_id, user_balance, sndr, info, _contacts, schedule, schedule_, 
                cpn, originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, is_api_access? aux_obj : null
            );

            if(resp.statusCode == 200 || resp.status == 200) return "OK";
            try {
                console.log('1ERROR in resp' + JSON.stringify(resp));
            } catch(err) {
                console.log('2ERROR in resp');
            }
            return "error";

        }

        async function _extractContacts(iter, meas) {
            let params = {}, contacts = [], targetcount;

            if(meas == "per_imp") {
                targetcount = parseFloat(budget) / parseFloat(cost);
                if(iter > 0) {
                    //  check delivery of prior messages
                    let delivered_ = models.Message.find({
                        where: {
                            perfcmpgnId: cid,
                            status: 1
                        },
                        attributes:['destination'],
                    })

                    let delivered = delivered_.map(d => { return d.destination });
                    targetcount =- delivered.length;
                    params = {
                        phone: {
                            $nin: delivered
                        }
                    }
                } 
            } else if(meas == "per_clk") {
                //  check click status of prior messages

                let tgt_clicks = Math.floor(parseFloat(budget) / parseFloat(cost));
                let delvrd_contacts = tgt_clicks / PCMPGN_CLICK_EXPECTED_CTR;
                let targetcount_ = delvrd_contacts / PCMPGN_CLICK_EXPECTED_DLVRY_RATE;
                targetcount = targetcount_ * PCMPGN_CLICK_ITERATION_VOLUMES[ iter - 1 ];
                // targetcount = Math.min(total_contacts, user_balance / PCMPGN_CLICK_PRICE_PER_SMS);

                if(iter > 0) {

                    let clicked_ = models.Message.find({
                        where: {
                            perfcmpgnId: cid,
                            status: 1,
                            clickcount: {
                                $gt: 0
                            }
                        },
                        attributes:['destination']
                    })

                    let clicked = clicked_.map(d => { return d.destination });
                    targetcount = (tgt_clicks < clicked.length) ? targetcount : 0;
                    params = {
                        phone: {
                            $nin: clicked
                        }
                    }
                }
            }

            console.log('***********  PCAMPAIGN TARGETS COUNT = ' + targetcount + "  ************");

            if(targetcount > 0) {
                console.log('..........  crit = ', JSON.stringify(crit) + "; params = " + JSON.stringify(params));
                contacts = await mongmodels.PerfContact.find({ ...crit, ...params })
                                    .select(['phone', 'fields.countryid'])
                                    .sort({ updatedAt: 'asc', usecount: 'asc' })
                                    .limit(targetcount);

                await mongmodels.PerfContact.updateMany({ ...crit, ...params }, { $inc: { usecount: 1 }})
                        .sort({ updatedAt: 'asc', usecount: 'asc' })
                        .limit(targetcount);

                console.log('.........  contacts count is: ' + contacts.length + '; and they re: ' + JSON.stringify(contacts));
                // if(!contacts.length) throw "no_contacts";
                // console.log("no_contacts");
                return contacts;
            } else return false;
        }

        function _acceptableTime(end) {
            const valid = [
                {
                    from: moment('7:00am', 'h:mma'),
                    to: moment('11:00am', 'h:mma'),
                },
                {
                    from: moment('4:00pm', 'h:mma'),
                    to: moment('8:30pm', 'h:mma'),
                },
            ]

            const noww = moment(moment().format('h:mma'), 'h:mma');

            for(let i = 0; i < valid.length; i++) {
                if(noww.isBefore(valid[i]).from) { 
                    if(valid[i].from.isAfter(end)) return "end";
                    return valid[i].from.toDate();
                }
                else if(noww.isBefore(valid[i]).to) {
                    if(valid[i].to.isAfter(end)) return "end";
                    return "now";
                }
            }

            const nextday = valid[0].from.add(1, 'days');
            return nextday.isAfter(end) ? "end" : nextday.toDate();
        }

        // res.send(resp);
        res.send({ response: rmsg});
        // return resp;


        _status = {
            response: {
            }, 
            responseType: "SUCCESS", 
            responseCode: "OK", 
            responseText: "Campaign created successfully.", 
        }
    
        function getRealName(abrv) {
            let fn = abrv;
            switch (abrv) {
                case "loc":
                    fn = "Location";
                    break;
                case "age":
                    fn = "Age";
                    break;
                case "gdr":
                    fn = "Gender";
                    break;
                case "sts":
                    fn = "Status";
                    break;
                case "inc":
                    fn = "Income Class";
                    break;
                case "int":
                    fn = "Interests";
                    break;
                case "per_imp":
                    fn = "Per Impression";
                    break;
                case "per_clk":
                    fn = "Per Click";
                    break;
                default:
                    break;
            }
            return fn;
        }

        function getApplicableName(name) {
            return name;
        }

        function listAges(str) {
            let all = [];
            let min = 8;
            let max = 120;

            str.forEach(s => {
                let arr = s.split(' - ');
                if(arr.length > 1) {
                    let from = parseInt(arr[0]);
                    let to = parseInt(arr[1]);

                    for(let n = from; n <= to; n++) {
                        all.push(n);
                    }
                } else if(s == 'Above 65') {
                    for(let n = 66; n <= max; n++) {
                        all.push(n);
                    }                    
                // } else if(s == 'Below 24') {
                //     for(let n = min; n < 24; n++) {
                //         all.push(n);
                //     }                    
                }
            })

            return all;
        }

    } catch(err) {
        console.log('...............' + err);
        let errmsg, errresp;

        if(err == "no_contacts") {
            errmsg = "No matching contacts found. Kindly contact Admin.";
            errresp = "Error. ";
        } else if(err == "not_approved") {
            errmsg = "Campaign not yet Approved. Kindly contact Admin.";
            errresp = "Error. ";
        } else if(err == "insufficient_balance") {
            errmsg = "You have insufficent units balance.";
            errresp = "Error. ";

            cpn = await mongmodels.PerfCampaign.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(cid),
            }, {
                "status.stage": "Terminated"
            })
    
    
        } else {
            errmsg = 'Please specify ';
            errresp = "Input error. ";

            switch (err) {
                case 'name':
                    errmsg += "'Campaign Name', ";
                    // break;
                case 'measure':
                    errmsg += "'Measure', ";
                    // break;
                case 'sender':
                    errmsg += "'Sender ID', ";
                    // break;
                case 'message':
                    errmsg += "'Message', ";
                    // break;
                case 'reqlist':
                    errmsg += "'Criteria', ";
                    // break;
                case 'budget':
                    errmsg += "'Budget', ";
                    break;
            
                default:
                    break;
            }
            if( errmsg == 'Please specify ') {
            }
        }
    
        _status = {
            response: errresp + errmsg, 
            responseType: "ERROR", 
            responseCode: "E000", 
            responseText: errmsg, 
        }

        res.send(_status);

    }



    // req.flash(_status.responseType.toLowerCase(), _status.responseText);
    // var backURL = req.header('Referer') || '/';
    // res.redirect(backURL);

}

exports.finish = async (req, res) => {
    try {
        await mongmodels.PerfCampaign.updateOne({
            _id: mongoose.Types.ObjectId(req.pcid),
        },{
            "status.stage": "Completed"
        })
    } catch(err) {
        return "error";
    }
}

exports.send_ = async (req, res) => {

    var user_id = req.user.id;
    // var user_id = 10;
    let cid = req.query.id;
    let user_balance, sndr, info = null, schedule, schedule_, cpn, originalmessage;
    let UNSUBMSG = false, DOSUBMSG, SINGLE_MSG, HAS_SURL, is_api_access = false, aux_obj;

    var _status;
    var crit_gdr, crit_inc, crit_int, crit_sts, crit_loc, crit_age;

    try {
        //  GET USER BALANCE
        let user_balance_ = await models.User.findByPk(user_id, {
            attributes: ['balance'], 
            raw: true, 
        })
        user_balance = user_balance_.balance;

        cpn = await mongmodels.PerfCampaign.findOne({
            _id: mongoose.Types.ObjectId(cid),
            userId: user_id,
        });
        sndr = cpn.senderId;
        originalmessage = cpn.message;
        schedule = cpn.startdate;
        // utm = (req.body.add_utm && req.body.add_utm == "on");
        DOSUBMSG = (req.body.add_optin && req.body.add_optin == "on");
        HAS_SURL = (originalmessage.search(/\[url\]/g) !== -1) && cpn.shorturl;
        SINGLE_MSG = !HAS_SURL;

        info = {
            shortlinkId: cpn.shorturl,
            units_used: cpn.adminamount || 1000,
        }

        let crits = cpn.conditionset;
        crits.forEach(c => {
            // let crit = getApplicableName(c.criteria);
            switch (c.criteria) {
                case 'Age':
                    crit_age = c.target;
                    break;
                case 'Gender':
                    crit_gdr = c.target;
                    break;
                case 'Status':
                    crit_sts = c.target;
                    break;
                case 'Location':
                    crit_loc = c.target;
                    break;
                case 'Income Class':
                    crit_inc = c.target;
                    break;
                case 'Interests':
                    crit_int = c.target;
                    break;
            
                default:
                    break;
            }
        })

        let contacts = await mongmodels.PerfContact.find({
            ...(crit_sts? {
                "fields.status": {
                    $in: crit_sts
                },
            } : {}),
            ...(crit_age? {
                "fields.age": {
                    $in: crit_age
                },
            } : {}),
            ...(crit_gdr? {
                "fields.gender": {
                    $in: crit_gdr
                },
            } : {}),
            ...(crit_inc? {
                "fields.income": {
                    $in: crit_inc
                },
            } : {}),
            ...(crit_int? {
                "fields.interests": {
                    $in: crit_int
                },
            } : {}),
            ...(crit_loc? {
                "fields.location": {
                    $in: crit_loc
                },
            } : {}),
        },"phone fields.countryid");

        console.log('contacts are: ' + JSON.stringify(contacts));

        let resp = await smsSendEngines(
            req, res,
            user_id, user_balance, sndr, info, contacts, schedule, schedule_, 
            cpn, originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, is_api_access? aux_obj : null
        );
        console.log('++++++++++++++++++++');
        console.log(resp);
        return resp;


        _status = {
            response: {
            }, 
            responseType: "SUCCESS", 
            responseCode: "OK", 
            responseText: "Campaign created successfully.", 
        }
    
        function getRealName(abrv) {
            let fn = abrv;
            switch (abrv) {
                case "loc":
                    fn = "Location";
                    break;
                case "age":
                    fn = "Age";
                    break;
                case "gdr":
                    fn = "Gender";
                    break;
                case "sts":
                    fn = "Status";
                    break;
                case "inc":
                    fn = "Income Class";
                    break;
                case "int":
                    fn = "Interests";
                    break;
                case "per_imp":
                    fn = "Per Impression";
                    break;
                case "per_clk":
                    fn = "Per Click";
                    break;
                default:
                    break;
            }
            return fn;
        }

        function getApplicableName(name) {
            return name;
        }
    } catch(err) {
        console.log(err);
        let errmsg = 'Please specify ';

        switch (err) {
            case 'name':
                errmsg += "'Campaign Name', ";
                // break;
            case 'measure':
                errmsg += "'Measure', ";
                // break;
            case 'sender':
                errmsg += "'Sender ID', ";
                // break;
            case 'message':
                errmsg += "'Message', ";
                // break;
            case 'reqlist':
                errmsg += "'Criteria', ";
                // break;
            case 'budget':
                errmsg += "'Budget', ";
                break;
        
            default:
                break;
        }
        if( errmsg == 'Please specify ') {
        }
    
        _status = {
            response: "Input error", 
            responseType: "ERROR", 
            responseCode: "E000", 
            responseText: errmsg, 
        }

    }

    req.flash(_status.responseType.toLowerCase(), _status.responseText);
    var backURL = req.header('Referer') || '/';
    res.redirect(backURL);

}

exports.view = (req, res) => {
    var user_id = req.user.id;
    var cmgnid = req.params.id;


    console.log('showing page...'); 
        
    Promise.all([
        sequelize.query(
            "SELECT * FROM ( SELECT COUNT(status) AS pending        FROM messages WHERE status = 0 AND campaignId = :cid ) t1," +
            "              ( SELECT COUNT(status) AS delivered      FROM messages WHERE status = 1 AND campaignId = :cid ) t2," +
            "              ( SELECT COUNT(status) AS failed         FROM messages WHERE (status = 2 OR status = 3) AND campaignId = :cid ) t3," +
            "              ( SELECT COUNT(status) AS undeliverable  FROM messages WHERE status = 4 AND campaignId = :cid ) t4," +
            "              ( SELECT COUNT(status) AS viewed         FROM messages WHERE status = 5 AND campaignId = :cid ) t5," +
            "              ( SELECT COUNT(status) AS clickc         FROM messages WHERE status = 1 AND clickcount > 0 AND campaignId = :cid ) t6," + 
            "              ( SELECT SUM(clickcount) AS clicks       FROM messages WHERE campaignId = :cid ) t7," + 
            "              ( SELECT userId                          FROM campaigns WHERE id = :cid ) t8 " +
            "WHERE t8.userId = :id" , {
                replacements: {
                    cid: cmgnid,
                    id: user_id,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        ).then(([results, metadata]) => {
            console.log(results);
            return results;
        }),
        models.Campaign.findAll({ 
            where: { 
                id: cmgnid,
                userId: user_id,
            },
            include: [{
                model: models.Message, 
                limit: 100,
                order: [ 
                    ['createdAt', 'DESC']
                ],
                include: [{
                    model: models.Contact, 
                    attributes: ['id', 'firstname', 'lastname', 'phone'],
                    // through: { }
                }], 
                attributes: ['status', 'deliverytime', 'readtime', 'firstclicktime', 'clickcount', 'destination', 'contactId'],
                // through: { }
            }], 
            order: [ 
                ['createdAt', 'DESC']
            ],
            limit: 1,
        }), 
        /* models.Message.count({
            where: { 
                userId: user_id,
            }
        }),  */
        sequelize.query(
            "SELECT COUNT(messages.id) AS msgcount FROM messages " +
            "JOIN campaigns ON messages.campaignId = campaigns.id " +
            "WHERE campaigns.userId = :uid " +
            "AND campaigns.id = :id ", {
                replacements: {
                    uid: user_id,
                    id: cmgnid,
                },
                type: sequelize.QueryTypes.SELECT,
            },
        ).then(([results, metadata]) => {
            console.log('unt is = ' + JSON.stringify(results));
           
            return results.msgcount;
        }),

        models.Campaign.findAll({ 
            where: { 
                ref_campaign: cmgnid,
                userId: user_id,
            },
            include: [{
                model: models.Message, 
                limit: 99,
                order: [ 
                    ['createdAt', 'DESC']
                ],
                include: [{
                    model: models.Contact, 
                    attributes: ['id', 'firstname', 'lastname', 'phone'],
                    // through: { }
                }], 
                attributes: ['status', 'deliverytime', 'readtime', 'firstclicktime', 'clickcount', 'destination', 'contactId'],
                // through: { }
            }], 
            order: [ 
                ['createdAt', 'DESC']
            ],
        }), 

    ]).then(([summary, cpgnrecp, mcount, refcpgns]) => {
        // console.log('qqq= '+cpgnrecp.length);
        var recipients = cpgnrecp[0].messages;
        console.log('REFERENCES: ' + JSON.stringify(refcpgns));
        // console.log('CONTA: ' + JSON.stringify(recipients));
        
        recipients = recipients.map(ii => {
            // let jj = JSON.stringify(ii);
            var i = JSON.parse(JSON.stringify(ii));
            var st = parseInt(i.status);

            if(i.contact == null && i.destination.length > 0) {
                var ds = i.destination;
                let pp = '0' + ds.substr(-10);

                i.contact = {
                    firstname: '--',
                    lastname: '--',
                    phone: pp,
                }
            }

            // console.log('PHONE = ' + i.contact.phone);
            
            switch (st) {
                case 0:
                    i.status = "Pending"
                    break;
                case 1:
                    i.status = "Delivered"
                    break;
                case 2:
                    i.status = "Failed"
                    break;
                case 3:
                    i.status = "DND"
                    break;
                case 4:
                    i.status = "Invalid"
                    break;
                case 5:
                    i.status = "Viewed"
                    break;
            
                default:
                    break;
            }
            
            return i;
            
        });
        // console.log('====================================');
        // console.log('SUMM: ' + JSON.stringify(summary) + '; MESS: ' + JSON.stringify(cpgnrecp) + '; CMSG: ' + JSON.stringify(recipients.length));
        // console.log('====================================');
        var mname = cpgnrecp.map((r) => r.name);
        var mmsg = cpgnrecp.map((r) => r.message);

        let cpgntype = cpgnrecp[0].platformtypeId == 1 ? "SMS" : "WhatsApp";
        let show_viewed = cpgnrecp[0].platformtypeId == 1 ? false : true;
        
        // REFERENCE STUFFS (IF ANY)
        let refmsgstat = [];
        refcpgns = refcpgns.map(ref => {
            let stats = {
                pending: 0,      
                delivered: 0,    
                failed: 0,       
                undeliverable: 0,
                viewed: 0,       
                clickc: 0,       
                mcount: ref.messages.length,       
            };
            ref.messages.forEach(msg => {
                switch (parseInt(msg.status)) {
                    case 0:
                        stats.pending += 1
                        break;
                    case 1:
                        stats.delivered += 1
                        break;
                    case 2:
                        stats.failed += 1
                        break;
                    case (3 || 4):
                        stats.undeliverable += 1
                        break;
                    case 5:
                        stats.viewed += 1
                        break;
                
                    default:
                        break;
                }
                stats.clickc += msg.clickcount;
            });
            // refmsgstat.push(stats) 
            // ref.refmsgstat = stats; 
            // const ref_ = Object.assign(ref, {stats});
            let _ref = JSON.parse(JSON.stringify(ref));
            const ref_ = Object.assign(_ref, {stats});
            // let ref_ = {...ref, stats};
            return ref_;
        });

        console.log('__________refcpgns=', JSON.stringify(refcpgns));
        /* let seen = [];
        console.log(JSON.stringify(refcpgns_, function (key, val) {
            if (val != null && typeof val == "object") {
                if (seen.indexOf(val) >= 0) {
                    return;
                }
                seen.push(val);
            }
            return val;
        }) ) */
        
        res.render('pages/dashboard/perfcampaign', { 
            page: '(' + cpgntype + ') Campaign: "' + mname + '"', //'Campaigns',
            campaigns: true,
            pcampaigns: true,

            args: {
                cmgnid,
                delivered: summary.delivered,
                pending: summary.pending,
                failed: summary.failed, 
                undeliverable: summary.undeliverable,
                viewed: summary.viewed,
                show_viewed,
                clicks: summary.clicks,
                recipients: recipients,
                mname,
                mmsg,
                mcount,
                ctr: ((parseInt(summary.delivered) == 0) ? '0' : Math.round((parseInt(summary.clickc) * 10/parseInt(summary.delivered) * 100)) / 10),

                refcpgns,   //  for follow-up campaigns
            }
        });

    });
};

exports.download = (req, res) => {
    var excel = require('excel4node');
    var workbook = new excel.Workbook();
    var worksheet = workbook.addWorksheet('Campaign Result');
    var style = workbook.createStyle({
        /* font: {
            color: '#FF0800',
            size: 12,
        }, */
        numberFormat: '$#,##0.00; ($#,##0.00); -'
    })

    var user_id = req.user.id;
    var cmgnid = req.params.id;


    console.log('trying to download ...'); 
        
    Promise.all([
        models.Campaign.findOne({ 
            where: { 
                id: cmgnid,
                userId: user_id,
            },
            include: [{
                model: models.Message, 
                // limit: 100,
                order: [ 
                    ['createdAt', 'DESC']
                ],
                include: [{
                    model: models.Contact, 
                    attributes: ['id', 'firstname', 'lastname', 'phone'],
                    // through: { }
                }], 
                attributes: ['status', 'deliverytime', 'readtime', 'firstclicktime', 'clickcount', 'destination'],
                // through: { }
            }], 
            order: [ 
                ['createdAt', 'DESC']
            ],
            // limit: 1,
        }), 
    ]).then(async ([cpgnrecp]) => {
        console.log('qqq= '+ JSON.stringify(cpgnrecp));
        var recipients = cpgnrecp.messages;
        
        worksheet.cell(1,1).string('First Name').style(style);
        worksheet.cell(1,2).string('Last Name').style(style);
        worksheet.cell(1,3).string('Phone').style(style);
        worksheet.cell(1,4).string('Status').style(style);
        worksheet.cell(1,5).string('Clicked').style(style);
        var itr = 1;

        recipients.forEach(ii => {
           itr++;
            // let jj = JSON.stringify(ii);
            var i = JSON.parse(JSON.stringify(ii));
            var st = parseInt(i.status);

            if(i.contact == null && i.destination.length > 0) {
                var ds = i.destination;
                let pp = '0' + ds.substr(-10);

                i.contact = {
                    firstname: '--',
                    lastname: '--',
                    phone: pp,
                }
            }

            worksheet.cell(itr,1).string(i.contact.firstname).style(style);
            worksheet.cell(itr,2).string(i.contact.lastname).style(style);
            worksheet.cell(itr,3).string(i.contact.phone).style(style);
            
            switch (st) {
                case 0:
                    i.status = "Pending"
                    break;
                case 1:
                    i.status = "Delivered"
                    break;
                case 2:
                    i.status = "Failed"
                    break;
                case 3:
                    i.status = "DND"
                    break;
                case 4:
                    i.status = "Invalid"
                    break;
                case 5:
                    i.status = "Viewed"
                    break;
            
                default:
                    break;
            }

            worksheet.cell(itr,4).string(i.status).style(style);
            worksheet.cell(itr,5).number(i.clickcount).style(style);

            
            // console.log('PHONE = ' + i.contact.phone);
            
            
        });
        let timestamp_ = new Date();
        let timestamp = timestamp_.getTime();
        let newfile = 'tmp/downloads/' + cpgnrecp.name + '_' + timestamp + '.xlsx';

        await workbook.write(newfile, (err, status) => {
            if(err) console.log('_______________ERROR: ' + err);
            else res.download(newfile);
        });
        console.log('____________DONE');

    });
};

// not maintained
exports.copy = (req, res) => {
    var user_id = req.user.id;
    var id = req.query.id;

    console.log('showing page...' + id); 
        
    Promise.all([
        sequelize.query(
            "SELECT campaigns.id, campaigns.name, campaigns.units_used, GROUP_CONCAT(groups.name SEPARATOR ', ') AS grpname, campaigns.createdAt FROM campaigns " +
            "JOIN campaign_groups ON campaign_groups.campaignId = campaigns.id " +
            "JOIN groups ON groups.id = campaign_groups.groupId " +
            "WHERE campaigns.userId = :uid " +
            "GROUP BY campaigns.id " +
            "ORDER BY campaigns.createdAt DESC ", {
                replacements: {
                    uid: user_id,
                },
                type: sequelize.QueryTypes.SELECT,
            },
        ), 
        models.Sender.findAll({     //  get all sender ids for display in form
            where: { 
                userId: user_id,
                status: 1
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }), 
        models.Group.findAll({      //  get all groups for display in form, except uncategorized group
            where: { 
                userId: user_id,
                name: {
                    [Sequelize.Op.ne]: '[Uncategorized]',
                }
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }),
        models.Group.findAll({      //  get only the uncategorized group
            where: { 
                userId: user_id,
                name: '[Uncategorized]',
            },
        }),
        models.Sender.count({       //  get count of sender ids
            where: { 
                userId: user_id,
                // status: 1
            }
        }), 
        models.Sender.count({       //  get count of "active" sender ids
            where: { 
                userId: user_id,
                status: 1
            }
        }), 
        models.Contact.count({      //  get count of contacts
            where: { 
                userId: user_id,
            }
        }), 
    ]).then(([cpns, sids, grps, non, csender, casender, ccontact]) => {
        var ngrp = non[0].id;

        // console.log('====================================');
        // console.log('cpns: ' + JSON.stringify(cpns) + ', sids: ' + JSON.stringify(sids) + ', grps: ' + JSON.stringify(grps) + ', csender: ' + csender + ', casender: ' + casender + ', ccontact' + ccontact);
        // console.log('====================================');
        if(!csender) var nosenderids = true; else var nosenderids = false;
        if(!casender) var noasenderids = true; else var noasenderids = false;
        if(!ccontact) var nocontacts = true; else var nocontacts = false;

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/perfcampaigns', { 
            page: 'Campaigns',
            campaigns: true,
            pcampaigns: true,
            flashtype, flash,

            args: {
                cpns,
                sids,
                grps,
                ngrp,
                nosenderids,
                noasenderids,
                nocontacts,
            }
        });
    });
};

