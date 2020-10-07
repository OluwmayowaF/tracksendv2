var express = require('express');
var router = express.Router();
var perfcampaignController = require('../controllers/PerfCampaignController');

// Home page route.
router.get('/', perfcampaignController.index);
// router.get('/sms', campaignController.smsindex);  //  inactive for now
// router.get('/whatsapp', campaignController.waindex);  //  inactive for now
// router.post('/analyze', perfcampaignController.analyse);
router.post('/add', perfcampaignController.add);
router.get('/campaign/:id', perfcampaignController.view);
router.get('/campaign/download/:id', perfcampaignController.download);
router.get('/copy', perfcampaignController.copy);


module.exports = router;