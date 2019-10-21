var express = require('express');
var router = express.Router();
var shortlinkController = require('../controllers/ShortLinkController');

// Home page route.
router.get('/', shortlinkController.index);
router.post('/add', shortlinkController.add);


module.exports = router;