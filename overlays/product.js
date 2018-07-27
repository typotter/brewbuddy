
var product = null;




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

var getTabId = function(label) {
  var a = $('a.navTab:contains(\'' + label + '\')');
  return a.attr('onclick').match(/tab_(\d+)/)[0].match(/\d+/)[0];
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

  console.log(product);

  var tabId = getTabId('Packaged Items');

  console.log(tabId);

  var identifyProductSkus = function(tabDiv) {
    return function(product) {
      if (!product.skus) {
        product.skus = {};
      }

      var rows = $("tr.datarow", tabDiv);
      console.log(rows);
      for (var i = 0; i < rows.length; ++i) {
        console.log(rows[i]);
        var row = $(rows[i]);
        rowguid = row.attr("rowguid");

        console.log($("td#Title", row)[0]);

        if (!product.skus[rowguid]) {
          product.skus[rowguid] = {
            "sku" : "",
            "guid" : rowguid,
            "product" : product.guid,
            "title" : $($("td#Title", row)[0]).attr("value")
          };
        }
      }
      console.log(product);
      product.save();
    }
  }


  // Add column to packaged items tab.
  var skuColumn = function() {
    tabDiv = $("#tab_" + tabId + "_section");
    if (tabDiv[0]) {
      productLoader = new ProductLoader();
      console.log(productLoader.loadProduct(product.guid));
      productLoader.loadProduct(product.guid).then(
        identifyProductSkus(tabDiv));
    }
  }
  skuColumn();

  document.body.addEventListener('afterRender', skuColumn, false);
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
