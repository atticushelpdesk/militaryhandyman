"use strict";

var jwt = require('jsonwebtoken');
var CONFIG = require('../config/config.js');

function ensureAuthorized(req, res, next) {
    var token = req.headers.authorization;
    if (token) {
        jwt.verify(token, CONFIG.SECRET_KEY, function (err, decoded) {
            if (err) {
                res.status(401).send('Unauthorized Access');
            } else {
                next();
            }
        });
    } else {
        res.status(401).send('Unauthorized Access');
    }
    //next(); //Safari
}

module.exports = function (app, io) {
    try {
        var accurate = require('../controller/site/accurate.js')(io);

        app.post('/check/account/accurateBackground', ensureAuthorized, accurate.accurateBackground);
        app.post('/check/account/accurateManual', ensureAuthorized, accurate.accurateManual);
        
        app.post('/site/accuratebackground/webhook', accurate.accurateBackgroundWebhook);

    } catch (e) {
        console.log('Error On Accurate Check', e);
    }
};
