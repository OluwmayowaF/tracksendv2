// This is middleware for restricting routes a user is not allowed to visit if not logged in
module.exports = function(req, res, next) {
  // If the user is logged in, continue with the request to the restricted route
  var _message = require('../../my_modules/output_messages');
if (req.user) {
    const db = require('../cfg/db');
    return db.query(
      "SELECT balance FROM users " +
      "WHERE id = (:id) ", {
          replacements: {id: req.user.id},
    })
    .then(async (balance) => {
      console.log('====================================');
      console.log('BALANCE IS : ' + JSON.stringify(balance));
      console.log('====================================');
      res.locals.balance = balance[0][0].balance ? balance[0][0].balance : 0;
      return next();

    })
    .catch((err) => {
        console.log('2ERROR!!!' + JSON.stringify(err));
      res.locals.balance = '??';
      return next(); 
    });

  }
  // If the user isn't' logged in, redirect them to the login page
  req.flash('type', 'error');
  req.flash('msg', _message('error', 1021, 234));
  return res.redirect("/login");
};

