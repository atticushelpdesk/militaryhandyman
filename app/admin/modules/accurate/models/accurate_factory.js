var app = angular.module('handyforall.accurate');
app.factory('AccurateService', AccurateService);
AccurateService.$inject = ['$http', '$q'];

function AccurateService($http, $q) {
    var AccurateService = {
        setCredentials: setCredentials,
        getCredentials: getCredentials
    };

    return AccurateService;

    function setCredentials(user, pwd) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/accurate/check',
            data: {
                username : user,
                password : pwd,
            }
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (err) {
            deferred.reject(err);
        });

        return deferred.promise;
    }

    function getCredentials() {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/accurate/get',
            data: { }
        }).success(function (data) {
            deferred.resolve(data);
        }).error(function (err) {
            deferred.reject(err);
        });

        return deferred.promise;
    }
}
