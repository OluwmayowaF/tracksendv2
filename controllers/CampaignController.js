var models = require('../models');
var moment = require('moment');
const request = require('request');
const tracksend_base_url = 'jj8wk.api.infobip.com';
const tracksend_user = "thinktech";
const tracksend_pwrd = "Tjflash8319#";

var buff = Buffer.from(tracksend_user + ':' + tracksend_pwrd);
var base64encode = buff.toString('base64');

exports.index = (req, res) => {
    var user_id = req.user.id;


    console.log('showing page...'); 
    
    
    Promise.all([
        models.Campaign.findAll({ 
            where: { 
                userId: user_id
            }, 
            order: [ 
                ['createdAt', 'DESC']
            ]
        }), 
        models.Sender.findAll({ 
            where: { 
                userId: user_id,
                status: 1
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }), 
        models.Group.findAll({
            where: { 
                userId: user_id
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }),
        models.Sender.count({
            where: { 
                userId: user_id,
                // status: 1
            }
        }), 
        models.Sender.count({
            where: { 
                userId: user_id,
                status: 1
            }
        }), 
        models.Contact.count({
            where: { 
                userId: user_id,
            }
        }), 
    ]).then(([cpns, sids, grps, csender, casender, ccontact]) => {
        // console.log('groups are: ' + JSON.stringify(sids));
        if(!csender) var nosenderids = true; else var nosenderids = false;
        if(!casender) var noasenderids = true; else var noasenderids = false;
        if(!ccontact) var nocontacts = true; else var nocontacts = false;

        res.render('pages/dashboard/campaigns', { 
            page: 'Campaigns',
            campaigns: true,
            flash: req.flash('success'),

            args: {
                cpns: cpns,
                sids: sids,
                grps: grps,
                nosenderids,
                noasenderids,
                nocontacts,
            }
        });
    });
};

exports.add = (req, res) => {
    var user_id = req.user.id;

    console.log('form details are now...'); 

    console.log('form details are now: ' + JSON.stringify(req.body)); 

    var message  = req.body.message;
                            // .replace(/<span spellcheck="false" contenteditable="false">firstname<\/span>/g, '[firstname]')
                            // .replace(/<span spellcheck="false" contenteditable="false">lastname<\/span>/g, '[lastname]')
                            // .replace(/<span spellcheck="false" contenteditable="false">email<\/span>/g, '[email]')
                            // .replace(/<span spellcheck="false" contenteditable="false">url<\/span>/g, '[url]');
    // console.log('schedule is: ' + schedule);
    
    var schedule = (req.body.schedule) ? moment(parseInt(req.body.schedule)).format('YYYY-MM-DD HH:mm:ss') : null;
    console.log('schedule is: ' + schedule);
    
    //  create campaign
    models.Campaign.create({
        name: req.body.name,
        description: req.body.description,
        userId: user_id,
        senderId: req.body.sender,
        shortlinkId: (req.body.shorturlid.length > 0) ? req.body.shorturlid : null,
        message: message,
        schedule: schedule,
        recipients: req.body.recipients,
    })
    .then((cpn) => {
        //  bind campaign to group(s)
        var group = req.body.group;

        if (group !== 0) {
            models.CampaignGroup.create({
                campaignId: cpn.id,
                groupId: group,
            })

            //  change status of shortlink to used
            if (req.body.shorturlid.length > 0) 
            models.Shortlink.findByPk(req.body.shorturlid)
            .then((shrt) => {
                shrt.update({
                    shorturl: req.body.myshorturl,
                    status: 1
                })
            })

            //  extract group contacts
            models.Group.findByPk(group)
            .then((grp) => {

                if(!grp) return;
                
                if(req.body.skip_dnd && req.body.skip_dnd == "on") {
                    var getconts = grp.getContacts({
                                            where: {
                                                status: 0
                                            }
                                        });
                } else {
                    var getconts = grp.getContacts();
                }
    
                getconts.then((contacts) => {
    
                    var q_bulkId = 'generateBulk';
                    var q_tracking_track = 'SMS';
                    var q_tracking_type = req.body.name.replace(/ /g, '_');

                    var m_from = 'FROM';
                    var m_flash = false;
                    var m_intermediateReport = true;
                    var m_notifyUrl = 'https://tracksend/sms/campaign/notify';
                    var m_notifyContentType = 'application/json';
                    var m_validityPeriod = 24 * 60; //  24 hours
                    var m_sendAt = schedule; //  24 hours

                    var k = 0;
                    var msgarray = '';

                    var fn = function checkAndAggregate(kont) {
                        k++;
                        return new Promise(resolve => {

                            //create contact codes
                            var uid;
                            if(req.body.shorturlid.length > 0) {
                                uid = makeId(3);
                                checkId(uid);
                            } else {
                                saveMsg(null, null);
                            }

                            function checkId(id) {
                                models.Message.findAll({
                                    where: { 
                                        contactlink: id,
                                    },
                                }).then((e) => {
                                    if(e.length) {
                                        // console.log(JSON.stringify(e));
                                        uid = makeId(3);
                                        checkId(uid);
                                    } else {
                                        saveMsg(id, req.body.shorturlid);
                                    }
                                })
                            }

                            function saveMsg(cid, sid) {
                                cpn.createMessage({
                                    contactlink: cid,
                                    shortlinkId: sid,
                                })
                                .then((shrt) => {

                                    var message  = req.body.message
                                    .replace(/\[firstname\]/g, kont.firstname)
                                    .replace(/\[lastname\]/g, kont.lastname)
                                    .replace(/\[email\]/g, kont.email)
                                    .replace(/\[url\]/g, 'https://tsn.go/' + cid + '/' + sid)
                                    .replace(/&nbsp;/g, ' ');
        
                                    var msgfull = {
                                        "from" : m_from,
                                        "destinations" : [{
                                            "to": kont.countryId + kont.phone.substr(1),
                                            "messageId": shrt.id,
                                        }],
                                        "text" : message,
                                        "sendAt" : m_sendAt,
                                        "flash" : m_flash,
                                        "intermediateReport" : m_intermediateReport,
                                        "notifyUrl" : m_notifyUrl,
                                        "notifyContentType" : m_notifyContentType,
                                        "validityPeriod" : m_validityPeriod,
                                    };

                                    resolve(msgfull);
                                    
                                })
                                
                            }

                        })
                    }

                    /* var fn = function aggregateMsgs(itr) {
                        msgarray += ' msg-' + k;
                        k++;
                        return new Promise(resolve => {


                            resolve()
                        })
                    } */

                    var start = 0;
                    var grpn = 3;
                    var len = contacts.length - 1;
                    var counter = 1;
                    
                    doLoop(0);
                    
                    //  loop through all the batches
                    function doLoop(start) { 
                        console.log('**************   ' + 'count of contacts = ' + len + '; start = ' + start + '   ****************');
                        if(start <= len) {
                            var end = (start + grpn > len) ? len : start + grpn;

                            var actions = contacts.slice(start, end).map(fn);
                            var results = Promise.all(actions);

                            results.then(data => {
 
                                var tosend = {
                                    "bulkId": 'CMPGN-' + cpn.id + '-' + counter,
                                    "messages": data,
                                    "tracking": {
                                        "track" : q_tracking_track,
                                        "type" : q_tracking_type,
                                    }, 
                                }

                                const options = {
                                  url: 'https://'+tracksend_base_url+'/sms/2/text/advanced',
                                  json: tosend,
                                  headers: {
                                    'Authorization': 'Basic ' + base64encode,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                  }
                                }
                                
                                request.post(options,(err, response) => {
                                  if (err){
                                    return console.log(err)
                                  }
                                
                                //   console.log(`Status code: ${response.statusCode}. Message: ${response.body}`);
                                  console.log('Status code: ' + response.statusCode + '; Message: ' + JSON.stringify(response.body));
                                });
                        
                        



                                console.log(JSON.stringify(tosend));
                                counter++;
                                if(end < len) doLoop(end)
                            })

                        }
                    }

                    //  finally redirect back to page
                    req.flash('success', 'Campaign created successfully. Messages sent out.');
                    var backURL = req.header('Referer') || '/';
                    res.redirect(backURL);

                });
                
            })
        }


        
    })
    console.log('done with msg = ' + message);
    

    return;
    models.User.findByPk(user_id).then(user => {

        user.createSender(req.body) 
        .then((sid) => {
            console.log('ID created');
            
            req.flash('success', 'Your new SenderID has been created.');
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);

        })

    })

	function makeId(length) {
		var result           = '';
		var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for ( var i = 0; i < length; i++ ) {
			 result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}

}
