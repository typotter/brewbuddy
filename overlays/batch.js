

var batchPageOverlay = function() {
  console.log('batch page overlay');

  var domRoot = window.document;
  batchId = getEkosFieldValue(getEkosFieldId('batch.batch_id', domRoot), domRoot);

  console.log("Batch ID: " + batchId);

  if (batchId == "") {
    // Assume a new batch
    chrome.runtime.sendMessage({action: MSG_ACTIONS.GET, path: '/config/ekos'}, function(response) {
        paintNextBatch(domRoot, response);
    });
  } else {

    chrome.runtime.sendMessage({action: MSG_ACTIONS.GET, path: '/batches/' + batchId}, function(response) {
        paintBatchPageOverlay(domRoot, response, batchId);
    });
  }
}

var paintNextBatch = function(domRoot, ekosConfig) {
  console.log(ekosConfig);
  setEkosInputValue('batch.batch_id', ekosConfig.next_batch_id, domRoot);
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

  var addStat = function(table, label, data) {
    var r = domRoot.createElement("tr");
    r.innerHTML = "<td>" + label + "</td><td>" + data + "</td>";   
    table.appendChild(r);
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

  if (batchData == null) return;
  if (batchData.hasOwnProperty('documents')) {

    // Add links to documents/
    var docs = ["Brewsheet", "Fermentation Log"]

    for (var i in docs) {
      doc = docs[i]
      if (batchData.documents.hasOwnProperty(doc)) {
        addLink(pdbCell, doc, batchData.documents[doc]);
      }
    }

  }
  //addLink(pdbCell, "Fermentation Graph", "http://prairiedogbrewing.ca:3000/dashboard/db/batch-status?orgId=1&from=now-7d&to=now&refresh=1m&var-batch_id=" + batchId);

  var a = domRoot.createElement('a');
  a.href = "http://prairiedogbrewing.ca:3000/dashboard/db/batch-status?orgId=1&from=now-7d&to=now&refresh=1m&var-batch_id=" + batchId;
  a.target = "_blank";
  var i = domRoot.createElement("img");
  i.src = "http://prairiedogbrewing.ca:3000/render/dashboard-solo/db/batch-status?refresh=1m&from=now-7d&to=now&orgId=1&var-batch_id=" + batchId + "&panelId=1&width=1000&height=500&tz=UTC-06%3A00"
  i.height=128
  a.appendChild(i);
  pdbCell.appendChild(a);

  var sgToPlato = function(sg) {
    return (259-(259 / (sg) )).toFixed(2);
  }

  var addBreweryData = function(data) {
    if (data == null) return;

    readings = data[Object.keys(data)[0]].readings;

    stats = {
      "Gravity" : sgToPlato(readings.gravity.value / 1000),
      "Temperature (tilt)" : readings.tilt_temperature.value,
      "Temperature (onewire)" : readings['1w_temperature'].value
    }

    var table = domRoot.createElement("table");
    table.classList.add("pdb-stat-table");
    for (var stat in stats) {
      addStat(table, stat, stats[stat]);
    }
    pdbCell.appendChild(table);
  }

  chrome.runtime.sendMessage({action: MSG_ACTIONS.GET_BREWERY_DATA, batchId: batchId}, function(response) {
      addBreweryData(response);
  });


}

