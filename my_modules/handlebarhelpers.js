/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/
const exphbs = require('express-handlebars');
var moment = require('moment');

var DateFormats = {
  short: "DD MMM 'YY, HH:mm",
  long: "dddd DD.MM.YYYY HH:mm"
};

const hbsHelpers = () => {

    var hbs = exphbs.create({
        defaultLayout: 'dashboard',
        helpers: {

            ifCond: function (v1, operator, v2, options) {
                switch (operator) {
                    case '==':
                        return (v1 == v2) ? options.fn(this) : options.inverse(this);
                    case '===':
                        return (v1 === v2) ? options.fn(this) : options.inverse(this);
                    case '!=':
                        return (v1 != v2) ? options.fn(this) : options.inverse(this);
                    case '!==':
                        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                    case '<':
                        return (v1 < v2) ? options.fn(this) : options.inverse(this);
                    case '<=':
                        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                    case '>':
                        return (v1 > v2) ? options.fn(this) : options.inverse(this);
                    case '>=':
                        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                    case '&&':
                        return (v1 && v2) ? options.fn(this) : options.inverse(this);
                    case '||':
                        return (v1 || v2) ? options.fn(this) : options.inverse(this);
                    default:
                        return options.inverse(this);
                }
            } ,

            formatDate: function (datetime, format) {
                if (moment) {
                    // can use other formats like 'lll' too
                    format = DateFormats[format] || format;
                    // return moment(datetime).fromNow();
                    // return moment(datetime).calendar();
                    return moment(datetime).format(format);
                }
                else {
                    return datetime;
                }
            } 

        }
    });

    return { hbs };
}

module.exports = hbsHelpers;
