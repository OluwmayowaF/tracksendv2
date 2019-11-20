var express = require('express');
var router = express.Router();
var integrationController = require('../controllers/IntegrationController');

// Home page route.
router.get('/', integrationController.index);
router.post('/update', integrationController.update);
// router.post('/pwrdupdate', integrationController.pwrdupdate);


module.exports = router;