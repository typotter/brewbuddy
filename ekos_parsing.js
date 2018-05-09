_FIELD_MAP = {
  "batch.batch_id": "Batch Number",
  "batch.product": "Product",
  "batch.recipe": "Recipe",
  "batch.status": "Status",
  "product.status": "Name"};

var getEkosFieldId = function(fieldId, domRoot) {
  return _getEkosFieldId(_FIELD_MAP[fieldId]);
}

var getEkosLabelSelector = function(label) {
  return 'div.inputfieldlabel:has(> label:contains("' +label + '"))';
}

var getEkosInputId = function(str) {
  return str.match(/(\d+)Input/)[1];
}

var _getEkosFieldId = function(label, domRoot) {
  return $(getEkosLabelSelector(label), domRoot).attr('class').match(/(\d+)Input/)[1];
}

var getEkosFieldValue = function(id, domRoot) {
  return $('.' + id + 'InputValue', domRoot).text().trim();
}

var getValueForLabel = function(label, domRoot) {
  return getEkosFieldValue(_getEkosFieldId(label, domRoot), domRoot);
}

var setEkosInputValue = function(fieldId, value, domRoot) {
  id = getEkosFieldId(field_id);
  return $('input#' + id, domRoot)[0].value = value;
}

var deployInventoryScan = function(domRoot) {

  tpl = `<button type="button" mobilefriendly="false" title="">
    <div class="CreateButton"></div></button>`;

  domRoot = document;
  var scanEkosIngredients = function(event) {
    var items = {};

    $('tr.datarow', domRoot).each(function(k,v) {
      var item = {};
      var h =$($('td.button_cell button', v)).attr('onclick');
      var re = /(\d+)/g;
      item.ekos_id = h.match(re)[1];

      var t =$('td#Item', v);
      item.ekos_label = t.text();
      item.ekos_hash = $(v).attr('rowguid');

      items[item.ekos_id] = item;
    });

    chrome.runtime.sendMessage({
      action: MSG_ACTIONS.WRITE_EKOS_MAP,
      section: "inventory_items",
      map: items
    },
    function(count) {
      alert(count + ' inventory items saved to Firebase');
    });

  };

  var btn = domRoot.createElement('div');
  btn.classList.add('button');
  btn.innerHTML = tpl;
  $("div.CreateButton", $(btn)).text("Scan Inventory Items");
  $(btn).click(scanEkosIngredients);
  $(btn).appendTo('div.button_section_centered');
}


