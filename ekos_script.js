
var integrate = function(overlay) {
  console.log('parsing page');

  if (overlay != null) {
    // Paint the overlay.
    overlay();
  } else {
    console.log('no page overlay');
  }
}
var teardown = function() {
  console.log('teardown');
}


var titleMatcher = function(title, overlay) {
  return {
    matcher:  function(domRoot) {
      return $("h1.page_title:contains('" + title + "')", domRoot).length > 0;
    },
    overlay: overlay
  }
}


var pageMatchers = [
  {
    matcher:  function(domRoot) {
      return $("h1.page_title:contains('Inventory')", domRoot).length > 0;
    },
    overlay: deployInventoryScan
  },
  titleMatcher("Product: ", productPageOverlay)
];



var matchPageToOverlay = function() {
  if ($('div#batch_main_info_panel').length > 0){
    return batchPageOverlay;
  }


  console.log('no overlay found for this page');

  for (var i in pageMatchers) {
    if (pageMatchers[i].matcher(document)) {
      console.log('matched page');
      return pageMatchers[i].overlay(document);
    }
  }
  return null;
}



/**
 * Main Function.
 */
var main = function() {
// Check to see if this is a frame. If so, paint any applicable overlay.
var overlay = matchPageToOverlay();
if (overlay == null) {
  // Inform the background page that this tab should have a page-action.
  chrome.runtime.sendMessage({
    action: MSG_ACTIONS.SHOW_PAGE_ACTION
  });
  return;
}

// Listen for changes to firebase authentication.
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == MSG_ACTIONS.AUTH_STATE) {
      if (request.state) {
        integrate(overlay);
      } else {
        teardown();
      }
    }
  });

// Subscribe to the auth state change. The AUTH_STATE message will be sent
// immediately with the current state, and sent again as the state changes.
chrome.runtime.sendMessage({action: MSG_ACTIONS.SUB_AUTH_STATE});

}();
