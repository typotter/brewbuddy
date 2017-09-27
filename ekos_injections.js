
var listenForDataInjection = function() {

var postObject = function(e) {
  console.log("data inject", e.detail);
  var obj = e.detail;

  objects.AddObject(obj.objID, obj.pageLayoutID, obj.recordID, obj.objName, '');

  var ekosObj = objects.GetObjectByID(obj.objID);

  for (var propId in obj.properties) {
    ekosObj.AddProperty(propId, null, true, propId);
    ekosObj.Properties["#" + propId].Value(obj.properties[propId].Value, obj.properties[propId].Text, "");
  }

  ekosObj.HasChanged = true;
  console.log('ekosObj', ekosObj);
  objects.Save("upsert", false, false, false, false, false, "", "");
/*
  ekosObj.AddProperty('10465','null',true,'10465','{"FilterGUID":"","FieldID":10465,"Value":"'+prodGUID+'","ByteValue":null,"Decoration":"","Tooltip":"","Text":"'+prodName+'"}', undefined, 'Product','');
*/

}

document.body.addEventListener("PDB_INJECT_DATA", postObject, false);
}




