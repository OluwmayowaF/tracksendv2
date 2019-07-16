var express = require('express');
var router = express.Router();
var campaignController = require('../controllers/CampaignController');

// Home page route.
router.get('/', campaignController.index);
router.post('/add', campaignController.add);


module.exports = router;