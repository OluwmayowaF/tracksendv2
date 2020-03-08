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
                    var dt_ = moment(datetime);//.format(format)
                    var dt = moment(datetime).format(format)
                    return dt_.isValid() ? dt : '--';
                }
                else {
                    return datetime;
                }
            } ,

            formatNumber: function (num) {
                if(!num) {
                    console.error('ERROR IN \'formatNumber\' of handlebarhelpers.js: num is null' + num);
                    return "00"
                }
                var nnum = num.toString().split(',');
                num = '';
                for(var i=0;i<nnum.length;i++) {
                    num += nnum[0]; 
                }
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            } 

        }
    });

    return { hbs };
}

module.exports = hbsHelpers;
