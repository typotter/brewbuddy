var config = {
  apiKey: "AIzaSyCfHp6dkivD_7EUQyiCn3ulSoJo5L_qoE8",
  databaseURL: "https://brewconsole.firebaseio.com",
  storageBucket: "brewconsole.appspot.com",
};
var fb = firebase.initializeApp(config);
var fbAuthenticated = false;

var knot = new KnotSource("brewbuddy", "ekos_");

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

/**
 * Subscribes the provided tab ID to changes in the firebase auth state.
 */
function notifyOnAuth(tabId) {
  firebase.auth().onAuthStateChanged(function(user) {
    chrome.tabs.sendMessage(tabId, {action: MSG_ACTIONS.AUTH_STATE, state: !!user});
  });
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
  switch (msg.action) {
    case MSG_ACTIONS.SUB_AUTH_STATE:
      notifyOnAuth(sender.tab.id);
      break;
    case MSG_ACTIONS.GET:
      if (fbAuthenticated) {
        firebase.database().ref(msg.path).once('value', sendResponse);
        return true;  // Indicates Async resolution
      } else {
        sendResponse(null);
      }
      break;
    case MSG_ACTIONS.GET_BREWERY_DATA:
      if (fbAuthenticated) {
        firebase.database().ref("/brewery").orderByChild('batch_id').equalTo(msg.batchId).once('value', sendResponse);
        return true;  // Indicates Async resolution
      } else {
        sendResponse(null);
      }
      break;
    case MSG_ACTIONS.SHOW_PAGE_ACTION:
      chrome.pageAction.show(sender.tab.id);
      break;

    case MSG_ACTIONS.WRITE_EKOS_MAP:
      console.log("Updating EKOS item map.");
      var ref = firebase.database().ref("/ekos_map/" + msg.section);

      var items = 0;
      for (var item in msg.map) {
        ref.child(item).set(msg.map[item]);
        items++;
      }
      sendResponse(items);
      break;

    case MSG_ACTIONS.WRITE:
      console.log("Writing to firebase");

      var ref = firebase.database().ref(msg.section);

      var items = 0;
      for (var item in msg.map) {
        ref.child(item).set(msg.map[item]);
        items++;
      }
      ref.child("_knot").update(knot.knotTag);

      sendResponse(items);
      break;
  }
});
