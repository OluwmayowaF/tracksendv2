var express = require('express');
var router = express.Router();
var campaignController = require('../controllers/CampaignController');

// Home page route.
router.get('/', campaignController.index);
router.get('/sms', campaignController.smsindex);  //  inactive for now
router.get('/whatsapp', campaignController.waindex);  //  inactive for now
router.post('/add', campaignController.add);
router.get('/campaign/:id', campaignController.view);
router.get('/copy', campaignController.copy);


module.exports = router;