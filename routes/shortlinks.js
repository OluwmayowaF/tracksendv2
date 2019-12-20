var express = require('express');
var router = express.Router();
var shortlinkController = require('../controllers/ShortLinkController');

// Home page route.
router.post('/add', shortlinkController.add);
router.get('/shortlink/:id', shortlinkController.details);
router.get('/', shortlinkController.index); 


module.exports = router;