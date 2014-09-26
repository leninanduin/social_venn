var app_folder = '/';
var app_uri = location.protocol+'//'+location.host+app_folder;
var redir_uri = app_uri+'?service=';
var fldrV  = 'views/' //views folder

var debug = 1;
function _log(a){
    if (debug){
        console.log(a);
    }
    return false
}

var socialVennApp = angular.module('socialVennApp', ['ngStorage','ngRoute', 'socialVennApp.services']);

// var twApp = angular.module('twitterApp', ['twitterApp.services']);

socialVennApp
.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider
        .when( app_folder+'setup_services', {
            templateUrl: fldrV+'services.html',
            controller: 'ServicesListCtrl'
        })
        .when( app_folder, {
            templateUrl: fldrV+'authCallback.html',
            controller: 'authCallbackCtrl'
        })

        $locationProvider.html5Mode(true);
}])
.controller('MainCtrl', ['$route', '$routeParams', '$location',function($route, $routeParams, $location) {
    this.$route = $route;
    this.$location = $location;
    this.$routeParams = $routeParams;
}])
.controller('ServicesListCtrl',
    ['$scope','$location', '$rootScope', '$localStorage','$routeParams','$interval','authService',
    function($scope,$location, $rootScope, $localStorage,$routeParams,$interval,authService){
        this.name = "ServicesList";
        this.params = $routeParams;

        $scope.services = [
            {
                name: "instagram",
                icon: "instagram.png",
                authUrl:"https://api.instagram.com/oauth/authorize/",
                authParams:{client_id:"8bafc02468fa4836b76fcbabde8fc807",redirect_uri:redir_uri+"instagram",response_type:"token"}
            },
            {
                name: "twitter",
                icon: "twitter.png",
                authUrl:"https://api.instagram.com/oauth/authorize/",
                authParams:{client_id:"9MjtryVdwtjRQwzTOVD8pDJ0k",redirect_uri:redir_uri+"instagram",response_type:"token"}
            },
            {
                name: "facebook",
                icon: "facebook.png"
            },
            {
                name: "lastfm",
                icon: "lastfm.png"
            }
        ];

        $scope.servicesList = [];
        for (var s in $scope.services){
            $scope.servicesList[s] = $scope.services[s].name;
        }

        $scope.callAuthService = function(serv){
            authService(serv);
        };
        //check for alrady auth services
        var auth_srvcs_watcher = $interval(function(){
            _log($localStorage);
            for (var s in $localStorage){
                if( s.match(/\$/g) === null  ){
                    _indx  = $scope.servicesList.indexOf( s )
                    if ( _indx > -1 ){
                        _log(s);
                        _log($scope.servicesList);
                        _log($('[data-service="'+s+'"]').length);
                        $('[data-service="'+s+'"]').attr('disabled',true).parent().append('&#x2713;');
                        $scope.servicesList.splice(_indx, 1);
                        _log($scope.servicesList);
                    }
                }
            }
        }, 1000);
}])
.controller('authCallbackCtrl',
    ['$scope','$location','$routeParams','saveLocalDataService',
    function($scope,$location, $routeParams,saveLocalDataService){
        this.name = "authCallback";
        this.params = $routeParams;

        if(location.search.match(/(\?service\=)/g)){
            //we try to save the access_token returned from the service
            try{
                service_name = location.search.replace(/(\?service\=)/g, '');
                at = location.hash.replace(/(\#\/?access_token\=)/g, '');
                // tmp_obj= {}
                // tmp_obj[service_name] = at;
                // _log(tmp_obj);
                saveLocalDataService(service_name, at);
                // $scope.$storage = $localStorage.$default(tmp_obj);
            }catch(e){
                _log(e);
            }
            window.close();
        }else{
            //nothing to do here
            $location.path( app_folder + 'setup_services')
        }
}])
.controller('TwitterController', function($scope, $q, twitterService) {
    $scope.tweets; //array of tweets

    twitterService.initialize();

    //using the OAuth authorization result get the latest 20 tweets from twitter for the user
    $scope.refreshTimeline = function() {
        twitterService.getLatestTweets().then(function(data) {
            $scope.tweets = data;
        });
    }

    //when the user clicks the connect twitter button, the popup authorization window opens
    $scope.connectButton = function() {
        twitterService.connectTwitter().then(function() {
            if (twitterService.isReady()) {
                //if the authorization is successful, hide the connect button and display the tweets
                $('#connectButton').fadeOut(function(){
                    $('#getTimelineButton, #signOut').fadeIn();
                    $scope.refreshTimeline();
                });
            }
        });
    }

    //sign out clears the OAuth cache, the user will have to reauthenticate when returning
    $scope.signOut = function() {
        twitterService.clearCache();
        $scope.tweets.length = 0;
        $('#getTimelineButton, #signOut').fadeOut(function(){
            $('#connectButton').fadeIn();
        });
    }

    //if the user is a returning user, hide the sign in button and display the tweets
    if (twitterService.isReady()) {
        $('#connectButton').hide();
        $('#getTimelineButton, #signOut').show();
        $scope.refreshTimeline();
    }
})
.factory('saveLocalDataService',['$scope', '$rootScope', '$localStorage', function($scope, $rootScope, $localStorage){
    return function (key, val) {
        $localStorage[key] = val;
        // $scope.$storage = $localStorage.$default(tmp_obj);
    }
}])
.factory('authService',['$window', '$q', 'twitterService', function($w, $q, twitterService){
    return function (service){
        _log('auth process for '+service.name);
        switch (service.name){
            case 'instagram':
                auth_url = service.authUrl + '?';
                for (var param in service.authParams){
                    auth_url += param+'='+service.authParams[param]+'&';
                }
                $w.open(auth_url, "", "width=500, height=400, top=100, left=100")
                // location.href = auth_url;
                _log(service.authParams);
            break;
            case 'twitter':
                twitterService.initialize();
                twitterService.connectTwitter().then(function() {
                    if (twitterService.isReady()) {
                        //if the authorization is successful, hide the connect button and display the tweets
                        // $('#connectButton').fadeOut(function(){
                        //     $('#getTimelineButton, #signOut').fadeIn();
                        //     $scope.refreshTimeline();
                        // });
                        _log(twitterService);
                    }
                });
            break;
        }
    }
}]);


