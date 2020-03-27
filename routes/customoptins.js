var express = require('express');
var router = express.Router();
var customOptinController = require('../controllers/CustomOptinController');

// Home page route.
router.get('/', customOptinController.index);
// router.post('/add/question', customOptinController.newquestion);
router.post('/update', customOptinController.updatemsg);
router.post('/option/save', customOptinController.saveoption);
// router.post('/pwrdupdate', integrationController.pwrdupdate);


module.exports = router;