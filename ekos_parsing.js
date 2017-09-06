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

var insertScanButton = function(domRoot) {

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

      items[item.ekos_id] = item;
    });

    chrome.runtime.sendMessage({
      action: MSG_ACTIONS.WRITE_EKOS_MAP,
      map: items
    },
    function(count) {
      alert(count + ' ingredients saved to Firebase');
    });

  };

  var btn = domRoot.createElement('div');
  btn.classList.add('button');
  btn.innerHTML = tpl;
  $("div.CreateButton", $(btn)).text("Scan Ingredients");
  $(btn).click(scanEkosIngredients);
  $(btn).appendTo('div.button_section_centered');
}
