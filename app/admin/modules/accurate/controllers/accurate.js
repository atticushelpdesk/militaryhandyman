angular.module('handyforall.accurate').controller('AccurateCtrl', AccurateCtrl);

AccurateCtrl.$inject = ['AccurateService', 'accurateServiceResolve','toastr'];

function AccurateCtrl(AccurateService, accurateServiceResolve, toastr) {

    var acl = this;
    acl.username = "";
    acl.password = "";

    console.log("accurateServiceResolve",accurateServiceResolve);

    if(accurateServiceResolve.status == 1){
        var settings = accurateServiceResolve.response;
        if(settings && settings.settings){
            acl.username = settings.settings.username;
            acl.password = settings.settings.password;
        }
    }

    acl.accurateSettings = function accurateSettings(valid){
        if(valid && acl.username && acl.password){
            AccurateService.setCredentials(acl.username,acl.password).then(function(res){
                console.log("RESPONSE",res);
                if(res && res.status == 1){
                    toastr.success("Credentials updated successfully");
                }else{
                    toastr.error(res.response);
                }
            });
        }else{
            toastr.error("Please provide necessary credentials");
        }
    }
}

