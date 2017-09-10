var r = /tab_(\d+)/;
var ekosProductMap = {
  title: "Name"
}

function EkosObject(map, domRoot) {
  console.log("Ekos Object", map, domRoot);
  for (var prop in map) {
    this[prop] = getValueForLabel(map[prop], domRoot);
  }
}

var ozToL = function(oz) { return oz * 0.0295735; }
var roundOzToL = function(oz) { return Mat.round(ozToL(oz)); }


var BEERSMITH_RECIPE_MAP = {
  title: "F_R_NAME",
  version: "F_R_VERSION",
  batch_size: ["F_E_BATCH_VOL", roundOzToL]
};
  

var parseDomForObject = function(map, dom) {
  var obj = {};
  for (var key in map) {
    var selector = Array.isArray(map[key]) ? map[key][0] : map[key];
    console.log(key, selector);
    var res = $(selector, dom);
    console.log(res);
    var text = res.length > 0 ? res[0].textContent : null;
    console.log(text);
    obj[key] = Array.isArray(map[key]) ? map[key][1](text) : text;
  }
  return obj;
}

var getTabId = function(label) {
  var a = $('a.navTab:contains(\'' + label + '\')');
  return a.attr('onclick').match(r)[0].match(/\d+/)[0];
}

var loadRecipeFromXml = function(recipe) {
  var dom = $(data);
  console.log(dom.find("F_R_NAME")[0].textContent);

  return parseDomForObject(BEERSMITH_RECIPE_MAP, dom);
}

var uploadRecipe = function() {
  console.log('upload recipe');

  var file = document.getElementById('pdb-upload-recipe').files[0];
  var reader = new FileReader();
  reader.onload = function(e){
    data = e.target.result;
    console.log('data', data);

    var recipeRoot = $("Recipe", $(data));    

    var recipe = loadRecipeFromXml(recipeRoot[0]);
    console.log(recipe);
  }
  reader.readAsText(file);

}




var injectHook = function() {
  var _oldRender = toggleSectionTab;
  toggleSectionTab = function(args) {
    var args = Array.prototype.slice.call(arguments);
    var ret =_oldRender.apply(this, arguments);
    var event = new CustomEvent('afterRender', {detail: args});
    document.body.dispatchEvent(event);
    return ret;
  }
  toggleSectionTab._overridenMethod = _oldRender;
}

var productPageOverlay = function() {
  console.log('product page overlay');

  var domRoot = window.document;
  var product = new EkosObject(ekosProductMap, domRoot);

  console.log(product);

  var tabId = getTabId('Recipes');

  // Add button in recipes tab.
  var addButton = function(event) {
    if (event.detail[0] == "tab_" + tabId) {
      var tabDiv = $('#tab_' + tabId + '_section');
      tabDiv.bind("DOMSubtreeModified", function() {
        if ($('div.button_section_centered', tabDiv).length == 0) return;
        tabDiv.unbind("DOMSubtreeModified");
        var btns = $('div.button_section_centered', tabDiv);
        insertUploadElements(domRoot, btns, "Upload Beersmith Recipe", uploadRecipe);
      });
    }
  }

  document.body.addEventListener('afterRender', addButton, false);
  injectScript(injectHook);
}



var insertUploadElements = function(domRoot, buttonSection, label, handler) {
  tpl = `<button type="button" mobilefriendly="false" title="">
    <div class="CreateButton"></div></button>`;

  var btn = domRoot.createElement('div');
  btn.classList.add('button');
  btn.innerHTML = tpl;
  $("div.CreateButton", $(btn)).text(label);
  $(btn).click(handler);

  var file = domRoot.createElement('input');
  file.type = "file";
  file.id = "pdb-upload-recipe";

  $(file).appendTo(buttonSection);
  $(btn).appendTo(buttonSection);
}
