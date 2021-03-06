var express = require('express');
var router = express.Router();
var topupController = require('../controllers/TopupController');

// Home page route.
router.get('/', topupController.index);
router.post('/pay', topupController.pay);
router.get('/ref', topupController.ref);
router.get('/error', topupController.errpg);
// router.post('/add', senderIdController.add);


module.exports = router;