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

var setEkosInputValue = function(fieldId, value, domRoot) {
  id = getEkosFieldId(fieldId);
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

var buttonHtml = `
  <style>
    @media print { .printhide{ display:none; } }
  </style>
  <div class="printhide">
    <button id="post">Post Invoice to K.N.O.T.S.</button>
  </div>
`;
var invoiceAddons = function(domRoot) {
  console.log("parsing invoice");
  var invoicetext = $("div#right_side_top")[0].innerText;
  var customertext = $("div#left_side_bottom")[0].innerText;
  var invtable = $("table:has(td:contains('SUBTOTAL')) td");
  var invoice = {
    "id": invoicetext.match(/Invoice\: E-(.*)/)[1],
    "date": invoicetext.match(/Order Date\: (.*)/)[1],
    "licensee": customertext.match(/License Number\: (.*)/)[1],
    items: [],
    subtotal: parseFloat(invtable[2].innerText.replace('$','')),
    tax: parseFloat(invtable[5].innerText.replace('$','')),
    total: parseFloat(invtable[8].innerText.replace('$',''))
  };

  var ordertable = $("table:has(th:contains('Item Number'))")[0];
  $("tr:has(td)", ordertable).each(function(i,o) {
    var td = $("td", o);
    invoice.items.push({
      sku: td[1].innerText,
      quantity: parseInt(td[3].innerText),
      unit_price: parseFloat(td[4].innerText.replace('$','').replace(',','')),
      total: parseFloat(td[5].innerText.replace('$','').replace(',',''))
    });
  });
  console.log("invoice", invoice);

  $("div#invoice_title").after(buttonHtml);
  document.title = "e-" + invoice.id;

  $("button#post").click(function() {
    console.log("POSTING invoice to knotted systems.");

    chrome.runtime.sendMessage({
      action: MSG_ACTIONS.WRITE,
      section: "invoice/" + invoice.id,
      map: invoice
    });

  });
}
