
var listenForDataInjection = function() {

var postObject = function(e) {
  console.log("data inject", e.detail);
  var obj = e.detail;

  objects.AddObject(obj.objID, obj.pageLayoutID, obj.recordID, obj.objName, '');

  var ekosObj = objects.GetObjectByID(obj.objID);

  for (var propId in obj.properties) {
    ekosObj.AddProperty(propId, null, true, propId, JSON.stringify(obj.properties[propId]));
  }

  objects.Objects[objects.Objects.length - 1].HasChanged = true;
  objects.Save("upsert", false, false, false, false, false, "", "");
}

document.body.addEventListener("PDB_INJECT_DATA", postObject, false);
}




