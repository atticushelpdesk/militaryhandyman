"use strict"

var request = require('request');
var db = require('../controller/adaptor/mongodb.js');
var async = require('async');
var mailcontent = require('../model/mailcontent.js');

function candidate(formData, tasker, callback) {
    db.GetOneDocument("settings", { "alias": "accurate" }, {}, {}, function (err, settings) {
        if (err || !settings) {
            console.log("Error", err);
            callback(err);
        } else {
            console.log("Settings", settings);
            var username = settings.settings.username;
            var password = settings.settings.password;
            var headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')
            };
            async.waterfall([
                function (callback) {
                    request.post({
                        url: "https://api.accuratebackground.com/v3/candidate",
                        headers: headers,
                        form: formData,
                        json: true
                    }, function (err, httpResponse, response) {
                        console.log("httpResponse.statusCode", httpResponse.statusCode);
                        console.log("response", response);
                        if (err || !response) {
                            callback(err);
                        } else {
                            if (httpResponse.statusCode == 200 && response.id) {
                                callback(err, response.id);
                            } else {
                                callback("Data Mismatch");
                            }
                        }
                    });
                },
                function (candidate, callback) {
                    console.log("Candidate", candidate);
                    request.post({
                        url: "https://api.accuratebackground.com/v3/order",
                        headers: headers,
                        form: {
                            "packageType": "PKG_EMPTY",
                            "workflow": "INTERACTIVE",
                            "candidateId": candidate,
                            "jobLocation.city": "Irvine",
                            "jobLocation.region": "CA",
                            "jobLocation.country": "US",
                            "additionalProductTypes[0].productType": "NCRIM",
                            "additionalProductTypes[1].productType": "SON",
                            /* "additionalProductTypes[2].productType": "MOV" */
                        },
                        json: true
                    }, function (err, httpResponse, response) {
                        console.log("httpResponse.statusCode", httpResponse.statusCode);
                        console.log("response", response);
                        if (err || !response) {
                            callback(err);
                        } else {
                            if (httpResponse.statusCode == 200 && response.id) {
                                callback(err, candidate, response.id);
                            } else {
                                callback("Data Mismatch");
                            }
                        }
                    });
                },
            ], function (err, candidate, order) {
                if (err) {
                    callback(err);
                } else {
                    var accurateBackground = {};
                    accurateBackground.accurateCheck = 2;
                    accurateBackground.candidate = candidate;
                    accurateBackground.order = order;
                    console.log("Accurate Background", accurateBackground);
                    db.UpdateDocument('tasker', { "_id": tasker }, { accurateBackground }, {}, function (err, update) {
                        callback(err, update);
                    });
                }
            });
        }
    });

}

function check(order, callback) {
    db.GetOneDocument("settings", { "alias": "accurate" }, {}, {}, function (err, settings) {
        if (err || !settings) {
            console.log("Error", err);
            callback(err);
        } else {
            console.log("Settings", settings);
            var username = settings.settings.username;
            var password = settings.settings.password;
            var headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')
            };
            var url = "https://api.accuratebackground.com/v3/order/" + order;
            console.log("URL", url);
            console.log("Header", headers);
            console.log("Order ID", order);
            request.get({
                url: url,
                headers: headers,
                json: true
            }, function (err, httpResponse, response) {
                console.log("httpResponse.statusCode", httpResponse.statusCode);
                console.log("response", response);
                if (err || !response) {
                    callback(err);
                } else {
                    if (httpResponse.statusCode == 200 && response.id) {
                        console.log("Response", response);
                        var status = response.result || false;
                        if(status){
                            switch (status) {
                                case "MEETS REQUIREMENTS":
                                    console.log("MEETS REQUIREMENTS");
                                    var update = {};
                                    update.accurateBackground = {};
                                    update.accurateBackground.accurateCheck = 1;
                                    update.status = 1;
                                    db.UpdateDocument('tasker', { "accurateBackground.order": order }, update, {}, function (err, result) {
                                        if (err || !result) {
                                            console.log("Error", err);
                                            callback(err);
                                        } else {
                                            db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
                                                db.GetOneDocument('tasker', { "accurateBackground.order": order }, {}, {}, function (err, tasker) {
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
                                            callback(err,"Data Verified Successfully");
                                        }
                                    });
                                    break;
                                case "NEEDS REVIEW":
                                    console.log("NEEDS REVIEW");
                                    callback("Data Verification Needs Review");
                                    break;
                                case "PENDING":
                                    console.log("PENDING");
                                    callback("Data Verification Pending");
                                    break;
                                case "CANCELLED":
                                    console.log("CANCELLED");
                                    callback("Data Verification Cancelled");
                                    break;
                                default:
                                    console.log("UNDEFINED");
                                    callback("Data Mismatch");
                            }
                        }else {
                            callback("Data Mismatch");
                        }
                    } else {
                        callback("Data Mismatch");
                    }
                }
            });
        }
    });
}

module.exports = {
    "candidate": candidate,
    "check": check
};
