var express = require('express');
var router = express.Router();
var senderIdController = require('../controllers/SenderIdController');

// Home page route.
router.get('/', senderIdController.index);
router.post('/add', senderIdController.add);


module.exports = router;