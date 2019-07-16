var express = require('express');
var router = express.Router();
var redirectController = require('../controllers/RedirectController');

// Home page route.
router.get('/:surl/:curl', redirectController.index);
router.get('/error', redirectController.error);


module.exports = router;