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
var roundOzToL = function(oz) { return Math.round(ozToL(oz)); }

var ozToKg = function(oz) { return oz * 0.0283495; }
var roundOzToKg = function(oz) { return Math.round(ozToKg(oz) * 1000)/1000; }

var ozToG = function(oz) { return oz * 0028.3495; }
var roundOzToG = function(oz) { return Math.round(ozToKg(oz) * 10)/10; }

var roundVersion = function(ver) { return Math.round(ver * 10) / 10; }

var product = null;


var BEERSMITH_RECIPE_MAP = {
  title: "F_R_NAME",
  version: ["F_R_VERSION", roundVersion],
  batch_size: ["F_E_BATCH_VOL", roundOzToL],
  grain: ["Ingredients Data Grain", {
    title: "F_G_NAME",
    quantity: ["F_G_AMOUNT", roundOzToKg]
  }],
  hops: ["Ingredients Data Hops", {
    title: "F_H_NAME",
    quantity: ["F_H_AMOUNT", roundOzToG],
    boil_time: ["F_H_BOIL_TIME", Math.round],
    dry_hop_time: ["F_H_DRY_HOP_TIME", Math.round]
  }],
  misc: ["Ingredients Data Misc", {
    title: "F_M_NAME",
    quantity: ["F_M_AMOUNT", Math.round]
  }],
};
  
var getTextContent = function(ele) { return ele.textContent; }
var pipe = function(fcn1, fcn2) {
  return function(ele) {
    return fcn2(fcn1(ele));
  };
}

var parseDomForObject = function(map, dom) {
  var obj = {};
  for (var key in map) {
    var transform = null, selector = null, isArr = false;
    if (Array.isArray(map[key])) {
      selector = map[key][0];
      if (typeof(map[key][1]) == "function") {
        transform = pipe(getTextContent, map[key][1]);
      } else {
        transform = function(ele) {
          return parseDomForObject(map[key][1], ele);
        }
        isArr = true;
      }
    } else {
      transform = getTextContent;
      selector = map[key];
    }

    var res = $(selector, dom);

    if (isArr) {
      obj[key] = [];
      if (res.length > 0) {
        res.each(function(k,v) {
          obj[key].push(transform(v));
        });
      }
    } else {
      if (res.length == 0) {
        obj[key] = null;
      } else {
        obj[key] = transform(res[0]);
      }
    }
  }
  return obj;
}

var getTabId = function(label) {
  var a = $('a.navTab:contains(\'' + label + '\')');
  return a.attr('onclick').match(r)[0].match(/\d+/)[0];
}

var loadRecipeFromXml = function(recipe) {
  var dom = $(data);
  return parseDomForObject(BEERSMITH_RECIPE_MAP, dom);
}

var uploadRecipe = function() {
  console.log('upload recipe');

  var file = document.getElementById('pdb-upload-recipe').files[0];
  var reader = new FileReader();
  reader.onload = function(e){
    data = e.target.result;
    var recipeRoot = $("Recipe", $(data));    
    var recipe = loadRecipeFromXml(recipeRoot[0]);
    console.log(recipe);

    var obj = {
      id: 923,
      objName: "Recipe",
      title: recipe.version,
      vol: recipe.batch_size,
      productName: product.title
    }

    var event = new CustomEvent("PDB_INJECT_DATA", {detail: obj});
    //document.body.dispatchEvent(event);


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
  product = new EkosObject(ekosProductMap, domRoot);

  /*  var obj = {
      id: 923,
      objName: "Recipe",
      title: "TEST",
      vol: 62,
      productName: product.title
    }
    var event = new CustomEvent("PDB_INJECT_DATA", {detail: obj});
    document.body.dispatchEvent(event);*/


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
