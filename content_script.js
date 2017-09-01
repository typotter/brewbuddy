var injectScript = function(func) {
  var actualCode = '(' + func + ')();';
  var script = document.createElement('script');
  script.textContent = actualCode;
  (document.head||document.documentElement).appendChild(script);
  script.remove();
}

var afterViewRecord = function(ele) {
  console.log('parsing page');
  var overlay = matchPageToOverlay();
  if (overlay != null) {
    overlay();
  } else {
    console.log('no page overlay');
  }
  
}

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
      loadBatchPageOverlay(domRoot.contentDocument);
    }

  });
}

var loadBatchPageOverlay = function(domRoot) {
  console.log('loading page overlay.');
  batchId = getEkosFieldValue(getEkosFieldId('batch.batch_id', domRoot), domRoot);

  console.log("Batch ID: " + batchId);

  //console.log(firebase.auth());

  /*firebase.database().ref('/batches/' + batchId).once('value').then(function(snapshot) {
    console.log('batch read returned.');
    console.log(snapshot.val());

    

  });*/
  chrome.runtime.sendMessage({action: "GET", path: '/batches/' + batchId}, function(response) {
      console.log("Response: ");
      console.log(response);
  });

}




















var injectHooks = function() {
  var _oldViewRecord = viewRecord;
  console.log('hooking onto viewRecord.');
  viewRecord = function(args) {
    _oldViewRecord.apply(this, arguments);
    console.log('dispatching after view record.');
    var event = new Event('afterViewRecord');
    document.body.dispatchEvent(event);
  }

  // For development
  viewRecord('753','85','',window,'','','','','','','','');
}

console.log('attaching listeners');
document.body.addEventListener('afterViewRecord', afterViewRecord, false);

console.log('injecting functions');
injectScript(injectHooks);


// Inform the background page that 
// this tab should have a page-action
chrome.runtime.sendMessage({
  action: 'showPageAction'
});


var config = {
  apiKey: "AIzaSyCfHp6dkivD_7EUQyiCn3ulSoJo5L_qoE8",
  databaseURL: "https://brewconsole.firebaseio.com",
  storageBucket: "brewconsole.appspot.com",
};
