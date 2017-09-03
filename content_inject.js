
var injectScript = function(func) {
  var actualCode = '(' + func + ')();';
  var script = document.createElement('script');
  script.textContent = actualCode;
  (document.head||document.documentElement).appendChild(script);
  script.remove();
}

var injectCss = function(domRoot, src) {
  var li = domRoot.createElement('link');
  li.type = 'text/css';
  li.rel = 'stylesheet';
  li.href = chrome.extension.getURL(src);
  domRoot.head.appendChild(li);
}

var injectHooks = function() {
  var _oldViewRecord = viewRecord;
  viewRecord = function(args) {
    _oldViewRecord.apply(this, arguments);
    var event = new Event('afterViewRecord');
    document.body.dispatchEvent(event);
  }
  viewRecord._overridenMethod = _oldViewRecord;

  // For development
  //viewRecord('753','33','',window,'','','','','','','','');
}

var removeHooks = function() {
  if (!!(viewRecord._overridenMethod)) {
    viewRecord = viewRecord._overridenMethod;
  }
}
