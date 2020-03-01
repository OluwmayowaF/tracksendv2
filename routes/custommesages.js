var express = require('express');
var router = express.Router();
var customMessagesController = require('../controllers/CustomMessagesController');

// Home page route.
router.get('/', customMessagesController.index);
router.post('/update', customMessagesController.update);
// router.post('/pwrdupdate', integrationController.pwrdupdate);


module.exports = router;