var models = require('../models');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

exports.index = (req, res) => {
    var user_id = req.user.id;

    models.Topup.findAll({ 
        where: { 
            userId: user_id
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then((tups) => {


        var data = JSON.stringify({
            "bulkId": "BULK-ID-123-xyz",
            "messages": [
              {
                "from": "0803",
                "destinations": [
                  {
                    "to": "2348033235527",
                    "messageId": "MESSAGE-ID-123-xyz"
                  },
                ],
                "text": "Just trying out stuff... hpoe it works.",
                "flash": false,
                "intermediateReport": true,
                "notifyContentType": "application/json",
                "callbackData": "DLR callback data",
                "validityPeriod": 720
              },
            ],
            "tracking": {
              "track": "SMS",
              "type": "MY_CAMPAIGN"
            }
          });
          
          var userpwrd = "thinktech:Tjflash8319#";
          var buff = new Buffer(userpwrd);
          var base64encode = buff.toString('base64');

          var xhr = new XMLHttpRequest(); 
          xhr.withCredentials = true;
          
          xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
              console.log(this.responseText);
            }
          });
          
          xhr.open("POST", "https://jj8wk.api.infobip.com/sms/2/text/advanced");
          xhr.setRequestHeader("authorization", "Basic " + base64encode);
          xhr.setRequestHeader("accept", "application/json");
          xhr.setRequestHeader("content-type", "application/json");
          
          xhr.send(data);
                              
          console.log('prowedge: ' + base64encode);
          



        res.render('pages/dashboard/topups', {
            page: 'TopUps',
            topups: true,
            // flash: req.flash('success'),

            args: {
                tups: tups,
            }
        });

    })


    console.log('showing page...'); 
    // var flash = req.flash('success')
    // console.log('flash details are now: ' + flash); 

    /* models.Sender.findAll({ 
        where: { 
            userId: user_id
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then((sids) => {
        console.log('groups are: ' + JSON.stringify(sids));
    }); */
};


exports.add = (req, res) => {
    var user_id = req.user.id;

    console.log('form details are now...'); 
    console.log('form details are now: ' + JSON.stringify(req.body)); 

    models.User.findByPk(user_id).then(user => {

        user.createSender(req.body) 
        .then((sid) => {
            console.log('ID created');
            
            req.flash('success', 'Your new SenderID has been created.');
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);

        })

    })


};
