// Initialise angular
var app = angular.module("themeswitcher", ['webicon']);

// Pull the templates
app.directive("navbar", function() {
  return {
    restrict: "E",
    templateUrl: "templates/navbar.html"
  }
});

app.directive("preview", function() {
  return {
    restrict: "E",
    templateUrl: "templates/preview.html"
  }
});

app.controller("ThemeSwitcherController", ['$scope', '$http', function($scope, $http) {

  // Set the theme colour
  // Set the background colour for several favicons/bookmarks
  $scope.themeColour = "#b0197e";
  $http.get("/api/colour").success(function (response) {
    $scope.themeColour = response;
  }).error( function (response) {
    $scope.themeColour = "#b0197e";
  });

  // Pull uid and name from the api
  // Sets the theme and gets profile image
  var uid = "test";
  var imgStr = "https://profiles.csh.rit.edu/image/";
  $scope.cdn = "/api/get";
  $http.get("/who").success(function (response) {
    uid = response.uid;
    $scope.profile = imgStr.concat(response.uid);
    $scope.name = response.name;
  }).error(function (error) { 
    $scope.profile = imgStr.concat("test");
    $scope.name = "Test";
  });

  // Enumerates the themes dropdown
  $scope.themes = [];
  $http.get("data/themes.json").success(function(response) {
    $scope.themes = response;
  });

  // Sets the theme selection via the api and hotswaps the page css
  $scope.cssFunc = function (link) {
    $http.get("/api/set/" + link);
    $scope.cdn = "https://s3.csh.rit.edu/" + link + "/4.0.0/dist/" + link + ".min.css";
  };

  // Get the current git revision to append to the bottom of the page
  $http.get("/rev").success(function(response) {
    $scope.gitRev = response;
  }).error(function (error) {
    $scope.gitRev = "GitHub";
  });

}]);
