module.exports = function (io) {

    var async = require('async');
    var db = require('../../controller/adaptor/mongodb.js');
    var acc = require('../../model/accurate.js');
    var mailcontent = require('../../model/mailcontent.js');

    var controller = {};

    controller.accurateBackground = function accurateBackground(req, res) {
        console.log("REQUEST OBTAINED", req.body);
        var data = {};
        data.status = '0';

        req.checkBody('firstName', res.__('Invalid Request')).notEmpty();
        req.checkBody('lastName', res.__('Invalid Request')).notEmpty();
        req.checkBody('email', res.__('Invalid Request')).notEmpty();
        var errors = req.validationErrors();
        if (errors) {
            data.response = errors[0].msg;
            res.send(data);
            return;
        }

        var email = req.body.email, firstname = req.body.firstName, lastname = req.body.lastName;
        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
        if (err ) {
            data.response = err || "Email Mismatch";
            res.send(data);
        } else {  
        db.GetOneDocument('tasker', { "email": email }, {}, {}, function (err, taskerac) {
            if (err || !taskerac) {
                console.log("Error", err);
                data.response = err || "Email Mismatch";
                res.send(data);
            } else {
                console.log("TaskerAC", taskerac);
                var taskerid = taskerac._id;
                var formData = {};
                formData.firstName = firstname;
                formData.lastName = lastname;
                formData.email = email;
                console.log("Candidate Request", formData);
                acc.candidate(formData, taskerid, function (err, response) {
                    if (err || !response) {
                        console.log("Error", err);
                        data.response = err || "Data Mismatch";
                        res.send(data);
                    } else {

                        var mailData = {};
                        mailData.template = 'taskerapprovalrequest';
                        mailData.to = settings.settings.email_address;
                        mailData.html = [];
                        mailData.html.push({ name: 'user', value: taskerac.username });
                        mailData.html.push({ name: 'site_url', value: settings.settings.site_url });
                        mailData.html.push({ name: 'site_title', value: settings.settings.site_title });
                        mailData.html.push({ name: 'logo', value: settings.settings.logo });
                        mailcontent.sendmail(mailData, function (err, response) { });

                        data.status = 1;
                        data.response = response;
                        res.send(data);
                    }
                });
            }
          });
       }
     });

    }

    controller.accurateBackgroundWebhook = function accurateBackgroundWebhook(req, res) {
        console.log("Request Obtained", req.body);
        var data = {};
        data.status = 0;

        req.checkBody('eventType', res.__('Invalid Event Type')).notEmpty();
        req.checkBody('environment', res.__('Invalid Environment')).notEmpty();

        var errors = req.validationErrors();
        if (errors) {
            data.response = errors[0].msg;
            res.send(data); return;
        }

        var request = req.body;
        var orderID = request.eventInfo.orderId;

        async.parallel({
            orderStatus: function (callback) {
                db.InsertDocument('accurate', request, function (err, accurate) {
                    callback(err, accurate);
                });
            },
            taskerStatus: function (callback) {
                if (request.eventType === 'ORDER_STATUS_CHANGE' && request.eventInfo.orderStatus === 'COMPLETE' && request.eventInfo.orderResult === 'MEETS_REQUIREMENTS') {
                    db.UpdateDocument('tasker', { "accurateBackground.order": orderID }, { 'accurateBackground.accurateCheck': 1, 'status': 1 }, {}, function (err, result) {
                        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
                            db.GetOneDocument('tasker', { "accurateBackground.order": orderID }, {}, {}, function (err, tasker) {
                                var mailData = {};
                                mailData.template = 'Profileapprovel';
                                mailData.to = tasker.email;
                                mailData.html = [];
                                mailData.html.push({ name: 'firstname', value: tasker.username });
                                mailData.html.push({ name: 'site_url', value: settings.settings.site_url });
                                mailData.html.push({ name: 'site_title', value: settings.settings.site_title });
                                mailData.html.push({ name: 'logo', value: settings.settings.logo });
                                mailcontent.sendmail(mailData, function (err, response) { });
                            });
                        });
                        callback(err, result);
                    });
                } else {
                    callback(null, null);
                }
            }
        }, function (err, result) {
            res.send("Success");
        });
    }

    controller.accurateManual = function accurateManual(req, res) {
        console.log("Request Obtained", req.body);
        var data = {};
        data.status = '0';

        req.checkBody('email', res.__('Invalid Request')).notEmpty();
        var errors = req.validationErrors();
        if (errors) {
            data.response = errors[0].msg;
            res.send(data);
            return;
        }

        var email = req.body.email;

        db.GetOneDocument('tasker', { 'email': email }, {}, {}, function (err, tasker) {
            if (err || !tasker) {
                console.log("Error", err);
                data.response = err || "Data Mismatch";
                res.send(data);
            } else {
                console.log("Tasker", tasker);
                var accurate = tasker.accurateBackground;
                if (accurate && accurate.order) {
                    acc.check(accurate.order, function (err, response) {
                        if (err || !response) {
                            console.log("Error", err);
                            data.response = err || "Data Mismatch";
                            res.send(data);
                        } else {
                            data.status = 1;
                            data.response = response;
                            res.send(data);
                        }
                    });
                }
            }
        })
    }

    return controller;

};