var express = require('express');
var router = express.Router();
var redirectController = require('../controllers/RedirectController');

// Home page route.
router.get('/:surl/:curl', redirectController.campaign);
router.get('/:surl', redirectController.browser);
// router.get('/:surl', redirectController.error);
// router.get('/error', redirectController.error);
router.get('*', redirectController.redirect);


module.exports = router;