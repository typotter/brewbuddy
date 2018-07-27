// Initialize Firebase
var config = {
  apiKey: "AIzaSyCfHp6dkivD_7EUQyiCn3ulSoJo5L_qoE8",
  databaseURL: "https://brewconsole.firebaseio.com",
  storageBucket: "brewconsole.appspot.com",
};

firebase.initializeApp(config);




var myApp = angular.module("my-app", []);

myApp.controller("PopupCtrl", ['$scope', '$http', function($scope, $http){
  console.log("Controller Initialized");

  $scope.loggedIn = false;

$scope.$watch('loggedIn', function(oldValue, newValue) {
    console.log(oldValue, newValue)
}, true)

  // Listen for auth state changes.
  // [START authstatelistener]
  firebase.auth().onAuthStateChanged(function(user) {
console.log("auth state changed", user);
    if (user) {
      // User is signed in.
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      var providerData = user.providerData;

      $scope.loggedIn = true;
    } else {
      $scope.loggedIn = false;
    }
    $scope.$digest();
  });
  // [END authstatelistener]


  /**
   * Starts the sign-in process.
   */
  $scope.signOut = function() {
    firebase.auth().signOut();
  };


  /**
   * Start the auth flow and authorizes to Firebase.
   * @param{boolean} interactive True if the OAuth flow should request with an interactive mode.
   */
  $scope.startAuth = function(interactive) {
    // Request an OAuth token from the Chrome Identity API.
    chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {
      if (chrome.runtime.lastError && !interactive) {
        console.log('It was not possible to get a token programmatically.');
      } else if(chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else if (token) {
        // Authrorize Firebase with the OAuth Access Token.
        var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
        firebase.auth().signInWithCredential(credential).catch(function(error) {
          // The OAuth token might have been invalidated. Lets' remove it from cache.
          if (error.code === 'auth/invalid-credential') {
            chrome.identity.removeCachedAuthToken({token: token}, function() {
              startAuth(interactive);
            });
          }
        });
      } else {
        console.error('The OAuth Token was null');
      }
    });
  };



}]);














