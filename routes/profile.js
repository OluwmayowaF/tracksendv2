var express = require('express');
var router = express.Router();
var profileController = require('../controllers/ProfileController');

// Home page route.
router.get('/', profileController.index);
router.post('/update', profileController.update);
router.post('/pwrdupdate', profileController.pwrdupdate);


module.exports = router;