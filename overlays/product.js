var ozToL = function(oz) { return oz * 0.0295735; }
var roundOzToL = function(oz) { return Math.round(ozToL(oz)); }

var ozToKg = function(oz) { return oz * 0.0283495; }
var roundOzToKg = function(oz) { return Math.round(ozToKg(oz) * 1000)/1000; }

var ozToG = function(oz) { return oz * 0028.3495; }
var roundOzToG = function(oz) { return Math.round(ozToKg(oz) * 10)/10; }

var roundVersion = function(ver) { return Math.round(ver * 10) / 10; }

var product = null;



var Mapper = function(section) {
  this._section = section;
  this._map = {};
  var self = this;

  this._updateMapping = function(title, value) {
    var o = {};
    o[title] = value;
    chrome.runtime.sendMessage({action: MSG_ACTIONS.WRITE_EKOS_MAP, section: self._section, map: o});
    self._map[title] = value;
  }

  this.getMap = function() { return self._map; }
  this.has = function(title) {
    return !!self._map && self._map.hasOwnProperty(self._safe(title));
  }
  this.get = function(title) { return self._map[self._safe(title)]; }

  this._safe = function(title) { return title.replace('/','_');}
  this.ingredientValueSink = function(title) {
    title = self._safe(title);
    return function(value) {
      self._updateMapping(title, value);
    };
  }


  chrome.runtime.sendMessage({action: MSG_ACTIONS.READ_EKOS_MAP, section: self._section}, function(res) { self._map = res != null ? res : self._map; });

}

var BS2_TO_EKOS = "bs2_to_ekos";
var mapper = new Mapper(BS2_TO_EKOS);

var getAttr = function(attr) {
  return function(value) {
    return $(value).attr(attr);
  };
}
var getGUIDFromRenderCall = function(onclick) {
  return onclick.match(/render\((.*?)\)/)[1].split(',')[4].replace(new RegExp("'", 'g'), "");
}

var EKOS_PRODUCT_MAP = {
  guid: ["li.tab_li a.navTab[onclick*=render]", [getAttr('onclick'), getGUIDFromRenderCall]],
  title: [getEkosLabelSelector('Name'), [getAttr('class'), getEkosInputId, getEkosFieldValue]]
}

var BEERSMITH_RECIPE_MAP = {
  title: "F_R_NAME",
  version: ["F_R_VERSION", roundVersion],
  batch_size: ["F_E_BATCH_VOL", roundOzToL],
  grain: ["Ingredients Data Grain", {
    title: "F_G_NAME",
    quantity: ["F_G_AMOUNT", roundOzToKg],
    ekos_id: ["F_G_NAME", mapper.get]
  }],
  hops: ["Ingredients Data Hops", {
    title: "F_H_NAME",
    quantity: ["F_H_AMOUNT", roundOzToG],
    boil_time: ["F_H_BOIL_TIME", Math.round],
    dry_hop_time: ["F_H_DRY_HOP_TIME", Math.round],
    ekos_id: ["F_H_NAME", mapper.get]
  }],
  misc: ["Ingredients Data Misc", {
    title: "F_M_NAME",
    quantity: ["F_M_AMOUNT", Math.round],
    ekos_id: ["F_M_NAME", mapper.get]
  }],
};
  
var getTextContent = function(ele) { return ele.textContent; }
var pipe = function(fcn1, fcn2, domroot) {
  return function(ele) {
    return fcn2(fcn1(ele, domroot), domroot);
  };
}
var pipes = function(fcns, domroot) {
  if (fcns.length == 0) {
    return function(foo, domroot) { return foo; };
  } else if (fcns.length == 1) {
    return fcns[0];
  } else {
    return pipe(fcns[0], pipes(fcns.slice(1), domroot), domroot);
  }
}

var parseDomForObject = function(map, dom) {
  var obj = {};
  for (var key in map) {
    var transform = null, selector = null, isArr = false;
    if (Array.isArray(map[key])) {
      selector = map[key][0];
      if (typeof(map[key][1]) == "function") {
        transform = pipe(getTextContent, map[key][1]);
      } else if (Array.isArray(map[key][1])) {
        transform = pipes(map[key][1]);
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
          obj[key].push(transform(v, dom));
        });
      }
    } else {
      if (res.length == 0) {
        obj[key] = null;
      } else {
        obj[key] = transform(res[0], dom);
      }
    }
  }
  return obj;
}

var createSelector = function(name, options, callback, parent) {
  var div = document.createElement("div");
  var select = document.createElement("select");
  for (var key in options) {
    var option = new Option(options[key].ekos_label, key);
    select.options[select.options.length] = option;
  }
  div.appendChild(select);
  var btn = document.createElement("button");
  btn.innerHTML = "<label>"+ name + "</label>";
  $(btn).click(function() {
    callback(select.value);
    parent.removeChild(div);
  });
  div.appendChild(btn);
  parent.appendChild(div);
}

var mapIngredients = function(ingredients, ptions) {
  var target = $('div.customizationLinks')[0];
  for (var i in ingredients) {
    var ing = ingredients[i];
    if (!mapper.has(ing.title)) {
      createSelector(ing.title, options, mapper.ingredientValueSink(ing.title), target);
    }
  }
}

var promptForInventoryMapping = function(recipe) {
  chrome.runtime.sendMessage({action: MSG_ACTIONS.READ_EKOS_MAP, section: "inventory_items"}, function(options) {
    mapIngredients(recipe.grain, options);
    mapIngredients(recipe.hops, options);
    mapIngredients(recipe.misc, options);
  });
}

var getTabId = function(label) {
  var a = $('a.navTab:contains(\'' + label + '\')');
  return a.attr('onclick').match(/tab_(\d+)/)[0].match(/\d+/)[0];
}

var loadRecipeFromXml = function(recipe) {
  var dom = $(data);
  return parseDomForObject(BEERSMITH_RECIPE_MAP, dom);
}

var checkForMap = function(items) {
  for (var i in items) {
    if (!mapper.has(items[i].title)) return false;
  }
  return true;
}

var doIt = function(recipe) {
  console.log("RECIPE MAPPED", recipe);

  var objProps = [];
  objProps[EKOS_PROPERTY_IDS.PRODUCT_PARENT] = {
    Value: product.guid, Text: product.title
  };
  objProps[EKOS_PROPERTY_IDS.NAME] = {
    Value: recipe.version, Text: recipe.version
  };
  objProps[EKOS_PROPERTY_IDS.BATCH_SIZE] = {
    Value: recipe.batch_size, Text: recipe.batch_size
  };
  objProps[EKOS_PROPERTY_IDS.BATCH_SIZE_UNIT] = {
    Value: EKOS_VALUES.LITRES, Text: "Liter(s)", Decoration: ""
  };

  var obj = {
    objID: EKOS_OBJECTS.RECIPE.ID,
    objName: EKOS_OBJECTS.RECIPE.NAME,
    pageLayoutID: EKOS_PAGE_LAYOUT_IDS.PRODUCT,
    recordID: 0,
    properties: objProps,
    ingredients: {
      mash: recipe.grain,
      hops: recipe.hops,
      misc: recipe.misc
    }
  }

  var event = new CustomEvent(EVENTS.INJECT_DATA, {detail: obj});
  document.body.dispatchEvent(event);
}
var uploadRecipe = function() {
  var file = document.getElementById('pdb-upload-recipe').files[0];
  var reader = new FileReader();
  reader.onload = function(e){
    data = e.target.result;
    var recipeRoot = $("Recipe", $(data));    
    var recipe = loadRecipeFromXml(recipeRoot[0]);

    // dev
    chrome.storage.sync.set({"recipe": recipe});

    var mapped = checkForMap(recipe.grain) && checkForMap(recipe.hops) && checkForMap(recipe.misc);

    if (!mapped) {
      alert("Please specify mapping for some ingredients first");

      promptForInventoryMapping(recipe);

      return;
    }

    doIt(recipe);

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
  product = parseDomForObject(EKOS_PRODUCT_MAP, document);

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

  // dev
  //chrome.storage.sync.get(["recipe"], function(e) {doIt(e.recipe);});

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
