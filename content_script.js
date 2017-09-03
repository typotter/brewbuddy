console.log("CS starting");

var matchPageToOverlay = function() {
  if ($('div.formTitle:contains("Open Batches")').length > 0){
    return batchPageOverlay;
  }
  return null;
}


_FIELD_MAP = {
  "batch.batch_id": "Batch Number",
  "batch.product": "Product",
  "batch.recipe": "Recipe",
  "batch.status": "Status"};

var getEkosFieldId = function(fieldId, domRoot) {
  return $('div.inputfieldlabel:has(> label:contains("' + _FIELD_MAP[fieldId] + '"))', domRoot).attr('class').match(/(\d+)Input/)[1];
}

var getEkosFieldValue = function(id, domRoot) {
  return $('.' + id + 'InputValue', domRoot).text().trim();
}

var batchPageOverlay = function() {
  console.log('batch page overlay');

  var domRoot = $('#formFrame_0')[0];

  var loaded = false;
  $(domRoot).load(function() {
    if (!loaded) {
      loaded = true;
      // First, inject stylesheet.
      injectCss(domRoot.contentDocument, 'pdb-styles.css');

      loadBatchPageOverlay(domRoot.contentDocument);
    }

  });
}

var loadBatchPageOverlay = function(domRoot) {
  console.log('loading page overlay.');
  batchId = getEkosFieldValue(getEkosFieldId('batch.batch_id', domRoot), domRoot);

  console.log("Batch ID: " + batchId);

  chrome.runtime.sendMessage({action: "GET", path: '/batches/' + batchId}, function(response) {
      paintBatchPageOverlay(domRoot, response, batchId);
  });

}

var paintBatchPageOverlay = function(domRoot, batchData, batchId) {
  var addLink = function(parent, text, href) {
    var e = domRoot.createElement("a");
    e.href = href;
    e.innerText = text;
    e.target = "_blank";
    var d = domRoot.createElement('div');
    d.classList.add('pdb-column-link');
    d.appendChild(e);
    parent.appendChild(d);
  }


  var layoutTable = domRoot.querySelector("#batch_main_info_panel div.section_inner table");
  var pdbCell = domRoot.createElement('td');
  pdbCell.classList.add('pdb-column');
  layoutTable.rows[0].appendChild(pdbCell);
  layoutTable.rows[0].cells[0].style = "";

  // Inject our Logo into the table.
  var img = domRoot.createElement("img");
  img.src = chrome.extension.getURL("pdb-logo-big.png");
  img.classList.add('pdb-logo');

  var txt = domRoot.createElement("div");
  txt.classList.add('pdb-logo-text');
  txt.innerText = "Technology Department";


  pdbCell.appendChild(img);
  pdbCell.appendChild(txt);


  // Add links to documents/
  var docs = {
    "Brewsheet": batchData.documents.brewsheet,
    "Fermentation Log": batchData.documents["fermentation log"]
  };

  // There's a couple of hidden rows in the table to account for.
  for (var doc in docs) {
    if (!!(docs[doc])) {
      addLink(pdbCell, doc, docs[doc]);
    }
  }

  addLink(pdbCell, "Fermentation Graph", "http://prairiedogbrewing.ca:3000/dashboard/db/batch-status?orgId=1&from=now-7d&to=now&refresh=1m&var-batch_id=" + batchId);

}

var afterViewRecord = function(ele) {
  console.log('parsing page');
  var overlay = matchPageToOverlay();
  if (overlay != null) {
    // Paint the overlay.
    overlay();
  } else {
    console.log('no page overlay');
  }
  
}


/**
 * Attaches listeners and injects hooks into page.
 */
var integrate = function() {

  console.log('attaching listeners');
  document.body.addEventListener('afterViewRecord', afterViewRecord, false);

  console.log('injecting functions');
  injectScript(injectHooks);
}

/**
 * Removes listeners and hooks.
 */
var teardown = function() {
  console.log('tear down');
  document.body.removeEventListener('afterViewRecord', afterViewRecord);
  injectScript(removeHooks);
}


// Inform the background page that this tab should have a page-action.
chrome.runtime.sendMessage({
  action: 'showPageAction'
});

// Listen for changes to firebase authentication.
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "AUTH_STATE") {
      if (request.state) {
        integrate();
      } else {
        teardown();
      }
    }
  });

// Subscribe to the auth state change. The AUTH_STATE message will be sent
// immediately with the current state, and sent again as the state changes.
chrome.runtime.sendMessage({action: "SUB_AUTH_STATE"});
