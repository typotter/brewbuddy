var config = {
  apiKey: "AIzaSyCfHp6dkivD_7EUQyiCn3ulSoJo5L_qoE8",
  databaseURL: "https://brewconsole.firebaseio.com",
  storageBucket: "brewconsole.appspot.com",
};
var fb = firebase.initializeApp(config);
var fbAuthenticated = false;

/**
 * initApp handles setting up the Firebase context and registering
 * callbacks for the auth status.
 *
 * The core initialization is in firebase.App - this is the glue class
 * which stores configuration. We provide an app name here to allow
 * distinguishing multiple app instances.
 *
 * This method also registers a listener with firebase.auth().onAuthStateChanged.
 * This listener is called when the user is signed in or out, and that
 * is where we update the UI.
 *
 * When signed in, we also authenticate to the Firebase Realtime Database.
 */
function initApp() {
  // Listen for auth state changes.
  firebase.auth().onAuthStateChanged(function(user) {
    console.log('User state change detected from the Background script of the Chrome Extension:', user);
    fbAuthenticated = (!!user);
  });
}

window.onload = function() {
  initApp();
};

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
  switch (msg.action) {
    case "AUTH_STATUS":
      sendResponse(fbAuthenticated);
      break;
    case "GET":
      if (fbAuthenticated) {
        console.log(msg.path);
        firebase.database().ref(msg.path).once('value', sendResponse);
        return true;  // Indicates Async resolution
      } else {
        sendResponse(null);
      }
      break;
    case "showPageAction":
      chrome.pageAction.show(sender.tab.id);
      break;
  }
});
