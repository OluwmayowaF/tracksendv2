const path = require('path');
const errorHandler = require('errorhandler');
const express = require('express');
const app = express();
app.use('/public', express.static(path.join(__dirname,'static')));
console.log('done');

/* const express = require('express');
const path = require('path');
const app = express();
// const server = require('http').createServer(app);
// const io = require('socket.io').listen(server);

// app.use('/public', express.static(path.join(__dirname, 'static')));
app.use('/public', express.static(path.join(__dirname,'static')));

app.get('/', (reqt, resp) => {
  resp.sendFile(path.join(__dirname, 'static','index.html'));
});

app.listen(3000);
console.log('running...'); */

/* app.use('/public', express.static(path.join(__dirname, 'static')));

app.get('/keke/:a/:b', (reqt, resp) => {
  console.log(reqt.params);
  
  resp.send('yo fro '+reqt.params.a+' to '+reqt.params.b);
})

app.get('/', (reqt, resp) => {
  resp.sendFile(path.join(__dirname, 'static','index.html'));
})

app.listen(3000);





// const tut = require('./sample');
const EventEmitter = require('events');
const http = require('http');
// const express = require('express');
//const socket = require('ws');

const eventEmitter = new EventEmitter();
const server = http.createServer((reqt, resp) => {
  console.log('really!');
  resp.write('ekaabo sori eto yi ooo');
  resp.end();
});

server.listen('3000');


// var app = express();

eventEmitter.on('push', (firstname, surname) => {
  console.log('His full name is '+firstname+' '+surname+'...pusher things');
})

class MyName extends EventEmitter {
  constructor(names) {
    super();

    this.namer = names;
  }

  get named() {
    return this.namer[0] + ' ' + this.namer[1];
  }
}

let oruko = new MyName(['kenny','shog']);
oruko.on('ask', (title)=>{
  console.log('my full name is '+ title + '. ' + oruko.named);
})

oruko.emit('ask', 'Mr'); */

/* eventEmitter.emit('push','kenny','sho');

console.log(tut.ad_(2,3));
console.log(tut.pi_);
console.log(new tut.ao_()); */


/* var mysql = require('mysql');
var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'bduser',
  password        : 'bdpwrd',
  database        : 'boardman'
});

pool.query('SELECT * FROM users', function (error, results, fields) {
  if (error) throw error;
  console.log(fields);
}); */


/* var MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://localhost:27017/test1', function (err, client) {
  if (err) throw err

  var db = client.db('test1')
  
  db.collection('users').find().toArray(function (err, result) {
    if (err) throw err

    console.log(result)
  })
})

db.users.insertMany(
  [
    {
      id: 3,
      name: 'Olu Mide',
      password: 'olu_mide',
      handle: 'olu_mide',
      email: 'olu_mide@yahoo.ng',
      location: {
        area: 'Ota',
        state: 'Ogun'
      },
      wins: 3,
      losses: 2,
      draws: 1,
      created_at: '2019-03-01 03:09:09',
      updated_at: '0000-00-00 00:00:00'
    },
    {
      id: 4,
      name: 'Luther Popo',
      password: 'luther_popo',
      handle: 'luther_popo',
      email: 'luther_popo@yahoo.ng',
      location: {
        area: 'Festac',
        state: 'Lagos'
      },
      wins: 3,
      losses: 2,
      draws: 1,
      created_at: '2019-02-26 20:48:09',
      updated_at: '0000-00-00 00:00:00'
    },

  ]
)

 */// var rand = require('./my_modules/randomid');
// console.log(rand(7, 'titi'));


// var names = ['mike', 'jane', 'peter'];
var names = ['mike'];
console.log('black');

var fn = function doThings(name) {
  return new Promise((resolve) => {
    console.log('blue');

    var char = name.substr(1);
    getNum(char);
    console.log('violet');

    function getNum(ch) {
      console.log('green');

      fetch('fetchfrom.url')
      .then(response => {
        console.log('orange');
        
        return response.json();
      }).then(n => {

        if(n === 2) {
          console.log('red1');

          fetch('fetchfrom.url')
          .then(response => {
            console.log('yellow');
            
            return response.json();
          }).then(color => {
            if(color === 2) {
              console.log('red2');
              
              resolve(5);
            }
            else {
              console.log('brown2');
              
              resolve(10);
            }
          });
          console.log('lilac');

        } else {
          console.log('brown1');
          
          resolve(20);
        }
        
      });
    }

  })


}

var actions = names.map(fn)
console.log('grey');

Promise.all([actions])
.then(() => {
  console.log('done');
})






/* 
{"bulkId":"CMPGN-45-3","messages":[{"from":"FROM","destinations":[{"to":"2348022334422","messageId":245},{"to":"2348022334423","messageId":246}],"text":"Hello ... ssdsdds","sendAt":null,"flash":false,"intermediateReport":true,"notifyUrl":"https://tracksend/sms/campaign/notify","notifyContentType":"application/json","validityPeriod":1440}],"tracking":{"track":"SMS","type":"Dr._Hayden_Wilderman_Jr."}}
Status code: 200; Message: {"bulkId":"CMPGN-45-1","messages":[{"to":"2348054433221","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"239"},{"to":"2348033252617","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"240"},{"to":"2348022334455","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"241"}]}
Status code: 200; Message: {"bulkId":"CMPGN-45-2","messages":[{"to":"2348032334457","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"242"},{"to":"2348022334458","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"243"},{"to":"2348022334459","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"244"}]}
Status code: 200; Message: {"bulkId":"CMPGN-45-3","messages":[{"to":"2348022334422","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"245"},{"to":"2348022334423","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"246"}]} */


models.Group.findByPk(groups)
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

            getconts
            .then(async (contacts) => {

                var uid = 'xxx';
                var allresults = [];

                function getSMSCount(txt) {
    
                    let len = txt.length;

                    const SMS_SIZE_MSG1 = 160;
                    const SMS_SIZE_MSG2 = 150;
                    const SMS_SIZE_MSG3 = 150;
                    const SMS_SIZE_MSG4 = 150;

                    if(len <= SMS_SIZE_MSG1) {
                        return 1;
                    } else if(len <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2)) {
                        return 2;
                    } else if(len <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2 + SMS_SIZE_MSG3)) {
                        return 3;
                    } else if(len <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2 + SMS_SIZE_MSG3 + SMS_SIZE_MSG4)) {
                        return 4;
                    } else {
                        return 5;
                    }
                }
                async function getCharge(prefix, ctry) {

                    var results = await sequelize.query(
                        "SELECT units FROM settingsuserbillings " +
                        "JOIN settingsnetworks ON settingsuserbillings.settingsnetworkId = settingsnetworks.id " +
                        "WHERE settingsuserbillings.userId = (:id) " +
                        "AND settingsnetworks.prefix = '" + prefix + "'", {
                            replacements: {id: user_id},
                        }
                    )
                    .then(async (res_charge) => {

                        console.log('RES!!!' + JSON.stringify(res_charge));
                        // console.log('RES!!!' + res_charge[0][0].units);

                        if(res_charge[0][0] && res_charge[0][0].units) {
                            console.log('444444');
                            return res_charge[0][0].units;
                            
                        } else {

                            let results_ = await models.Settingsnetwork.findAll({
                                /* include: [{
                                    model: models.Settingsdefaultbilling, 
                                    attributes: ['units'], 
                                    raw: true,
                                    // through: { }
                                }], */
                                where: { 
                                    prefix: prefix,
                                    countryId: ctry,
                                },
                                attributes: ['unitscharge'], 
                                limit: 1,
                            })
                            .then((res_rcharge) => {
                                console.log('RRES!!!' + JSON.stringify(res_rcharge));
                                console.log('RRES!!!' + res_rcharge.map((r) => r.unitscharge));
                                return res_rcharge.map((r) => r.unitscharge);
                            })
                            .catch((err) => {
                                console.log('1ERROR!!!' + JSON.stringify(err));
                            });

                            return results_;
console.log('555555');
                        }

                    })
                    .error((r) => {
                        console.log("Error: Please try again later");
                        res.send({
                            response: "Error: Please try again later",
                        });
                    })
    
                    return results;
                }                                                     
                async function checkAndAggregate(kont) {  

                    var message  = req.body.message
                        .replace(/\[firstname\]/g, kont.firstname)
                        .replace(/\[lastname\]/g, kont.lastname)
                        .replace(/\[email\]/g, kont.email)
                        .replace(/\[url\]/g, 'https://tsn.go/' + req.body.myshorturl + '/' + uid)
                        .replace(/&nbsp;/g, ' ');

                    let cc = getSMSCount(message);
                    msgcount += cc;

                    let prefix = kont.phone.substr(0, 4);
                    let unit_ = await getCharge(prefix, kont.countryId);

                    units += unit_ * cc;
                    return unit_;

                }

                for (let i = 0; i < contacts.length; i++) {
                    allresults.push(await checkAndAggregate(contacts[i]));
                }

                Promise.all([
                    allresults,
                    models.User.findByPk((user_id), {
                        attributes: ['balance'],
                        raw: true
                    })
                ])
                .then(async ([all, bal]) => {
                    
                    console.log('THE END!!! balance ' + JSON.stringify(bal));
                    console.log('THE END!!!');

                    let tid = req.body.analysis_id;

                    if(tid == 0) {
                        var tt = await models.Tmpcampaign.create({
                            name: req.body.name,
                            description: req.body.description,
                            userId: user_id,
                            senderId: req.body.sender,
                            shortlinkId: (req.body.shorturlid.length > 0) ? req.body.shorturlid : null,
                            myshorturl: req.body.myshorturl,
                            grp: req.body.group,
                            message: req.body.message,
                            schedule: null, //req.body.schedule,
                            recipients: req.body.recipients,
                            skip_dnd: (req.body.skip_dnd) ? req.body.skip_dnd : null,
                            units_used: units,
                        })
                        .then((tmp) => {
                            console.log('TP CREATED');
                            
                            return tmp.id;
                        })
                        .error((r) => {
                            console.log("3Error::: Please try again later: " + JSON.stringify(r));
                        })

                        return [bal.balance, parseInt(tt)];
                    } else {
                        var tt = await models.Tmpcampaign.findByPk(tid)
                        .then((tp) => {
                            return tp.update({
                                name: req.body.name,
                                description: req.body.description,
                                userId: user_id,
                                senderId: req.body.sender,
                                shortlinkId: (req.body.shorturlid.length > 0) ? req.body.shorturlid : null,
                                myshorturl: req.body.myshorturl,
                                grp: req.body.group,
                                message: req.body.message,
                                schedule: null, //req.body.schedule,
                                recipients: req.body.recipients,
                                skip_dnd: (req.body.skip_dnd) ? req.body.skip_dnd : null,
                                units_used: units,
                            })
                            .then(() => {
                                return tid;
                            })
                            .error((r) => {
                                console.log("1Error::: Please try again later: " + JSON.stringify(r));
                            })
                        })
                        .error((r) => {
                            console.log("2Error::: Please try again later: " + JSON.stringify(r));
                        })

                        return [bal.balance, parseInt(tid)];
                    }
                    /* console.log('TT = ' + JSON.stringify(tt));
                    

                    return tt.then((tmpid) => {
                        console.log('TID = ' + JSON.stringify(tmpid));
                        
                        let bye = ;
                        console.log('post1... ' + JSON.stringify(bye));
                        
                        return bye;
                    })
                    .error((r) => {
                        console.log("4Error::: Please try again later: " + JSON.stringify(r));
                    }) */
                })
                .then((fin) => {
                    console.log('post2... ' + JSON.stringify(fin));
                    
                    res.send({
                            tmpid: fin[1],
                            msgcount,
                            contactcount: contacts.length,
                            units,
                            balance: fin[0],
                        });
                })
                .catch((r) => {
                    console.log("0Error:: Please try again later: " + JSON.stringify(r));
                    res.send({
                        response: "Error: Please try again later",
                    });
                })
                
            })
            .error((r) => {
                console.log("00Error::: Please try again later: " + JSON.stringify(r));
                res.send({
                    response: "Error: Please try again later",
                });
            })

        })
        .error((r) => {
            console.log("Error: Please try again later");
            res.send({
                response: "Error: Please try again later",
            });
        })
        