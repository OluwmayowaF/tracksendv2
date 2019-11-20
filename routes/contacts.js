var express = require('express');
var router = express.Router();
var contactController = require('../controllers/ContactController');
var groupController = require('../controllers/GroupController');

// Home page route.
router.get('/', contactController.index);
router.get('/list', contactController.contactList);
router.get('/list/:lnkgrp', contactController.contactList);
router.get('/new', contactController.newContact);
router.get('/groups/sms', groupController.listSMSGroup);
router.get('/groups/whatsapp', groupController.listWAGroup);
// router.get('/groups', groupController.groupList);

router.post('/add', contactController.addContact);
// router.post('/upload', contactController.contactList);
router.post('/groups/add', groupController.addGroup);

// router.get('/edit/:id', contactController.contactList);
// router.get('/groups/edit/:id', groupController.groupList);

// router.post('/edit/:id', contactController.contactList);
// router.post('/groups/edit/:id', groupController.groupList);

// router.get('/delete/:id', contactController.contactList);
// router.get('/groups/delete/:id', groupController.groupList);


module.exports = router;