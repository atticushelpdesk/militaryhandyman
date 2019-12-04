"use strict";

/** Dependency Injection */
var express = require('express') // $ npm install express
    , path = require('path') // Node In-Build Module
    , bodyParser = require('body-parser') // $ npm install body-parser
    , session = require('express-session') // $ npm install express-session
    , cookieParser = require('cookie-parser') // $ npm install cookie-parser
    , passport = require('passport') // $ npm install passport
    , flash = require('connect-flash') // $ npm install connect-flash
    , mongoose = require('mongoose') // $ npm install mongoose
    , validator = require('express-validator') // $ npm install express-validator
    , CONFIG = require('./config/config') // Injecting Our Configuration
    , favicon = require('serve-favicon') // $ npm install serve-favicon
    , compression = require('compression')
    , url = require('url')
	, redirect = require("express-redirect")
    , i18n = require("i18n");
/** /Dependency Injection */

/** Socket.IO */
var app = express(); // Initializing ExpressJS
redirect(app);
var server = require('http').createServer(app);
var io = require('socket.io')(server);
/** /Socket.IO */

/** Global Configuration*/
global.GLOBAL_CONFIG = CONFIG.GLOBAL;

/** Middleware Configuration */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
i18n.configure({ locales: ['en', 'ar'], defaultLocale: 'en', autoReload: true, directory: __dirname + '/uploads/locales', syncFiles: true });
app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true })); // Parse application/x-www-form-urlencoded
app.use(bodyParser.json({ limit: '100mb' })); // bodyParser - Initializing/Configuration
app.use(cookieParser('CasperonHandyforall')); // cookieParser - Initializing/Configuration cookie: {maxAge: 8000},
app.use(session({ secret: 'CasperonHandyforall', resave: true, saveUninitialized: true })); // express-session - Initializing/Configuration
app.use(validator());
app.use(passport.initialize()); // passport - Initializing
app.use(passport.session()); // passport - User Session Initializing
app.use(flash()); // flash - Initializing
app.use(compression()); //use compression middleware to compress and serve the static content.
app.use('/app', express.static(path.join(__dirname, '/app'), { maxAge: 7 * 86400000 })); // 1 day = 86400000 ms
app.use('/uploads', express.static(path.join(__dirname, '/uploads'), { maxAge: 7 * 86400000 }));
app.use(i18n.init);
app.set('view engine', 'pug');
app.locals.pretty = true;
app.set('views', './views');

app.redirect("/sign-in", "/login", 301);
app.redirect("/submit-project", "/", 301);
app.redirect("/where-we-are", "/", 301);

app.use(function (req, res, next) {
	var pathURL = req.originalUrl.split('/');
	if(pathURL[1] == 'news'){ return res.redirect('/'); }
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    i18n.setLocale(req.headers["accept-language"] || 'en');
    next();
});
/** /Middleware Configuration */

/** MongoDB Connection */
mongoose.connect(CONFIG.DB_URL, {useMongoClient: true});
mongoose.connection.on('error', function (error) { console.error('Error in MongoDb connection: ' + error); });
mongoose.connection.on('connected', function () { });
mongoose.connection.on('reconnected', function () { });
mongoose.connection.on('disconnected', function () { console.log('MongoDB disconnected!'); });
/** /MongoDB Connection */

/** Dependency Mapping */
require('./routes')(app, passport, io, i18n);
require('./sockets')(io);
require('./cron');
/** /Dependency Mapping*/

/** HTTP Server Instance */
try {
    server.listen(CONFIG.PORT, function () {
        console.log('Server turned on with', CONFIG.ENV, 'mode on port', CONFIG.PORT);
    });
} catch (ex) {
    console.log(ex);
}
/** /HTTP Server Instance */
