var express = require('express');
var router = express.Router();
var redirectController = require('../controllers/RedirectController');

// Home page route.
router.get('/:surl/:curl', redirectController.index);
// router.get('/:surl', redirectController.error);
// router.get('/error', redirectController.error);
router.get('*', redirectController.error);


module.exports = router;