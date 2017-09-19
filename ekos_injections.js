/*
createRecord('923','10465','f2eaec4a-eb44-e711-9e7b-021788a910d1',this,'','','','','','800','1000');

objId, f-key, fkey-guid...


objNamme = Recipe
objId = 923
PageLId = 1783


function (_objectID, _pageLayoutID, _recID, _objectName, _objectRowGUID, _inlineEdit)

*/

var listenForDataInjection = function() {

var LITRES = "4a711580-0e6c-e411-9f99-d4ae5266e0c4";

var postObject = function(e) {
  console.log("data inject", e.detail);
//    objects.AddObject(e.detail.id, 0, 0, e.detail.objName, "", false);
  var obj = e.detail;

  var vol = e.detail.vol;
  var title = e.detail.title;
  var prodName = e.detail.productName;
  var prodGUID = obj.properties.prodGuid;

  objects.AddObject(obj.objID, obj.pageLayoutID, obj.recordID, obj.objName, '');


  objects.GetObjectByID("923").AddProperty('10465','null',true,'10465','{"FilterGUID":"","FieldID":10465,"Value":"'+prodGUID+'","ByteValue":null,"Decoration":"","Tooltip":"","Text":"'+prodName+'"}', undefined, 'Product','');
  objects.GetObjectByID("923").AddProperty('10462','null',true,'10462','{"FilterGUID":"","FieldID":10462,"Value":"'+title+'","ByteValue":null,"Decoration":"","Tooltip":"","Text":"'+title+'"}', undefined, 'Title','Title/Version');
  objects.GetObjectByID("923").AddProperty('10463','null',true,'10463','{"FilterGUID":"","FieldID":10463,"Value":"' + vol+'","ByteValue":null,"Decoration":"","Tooltip":"","Text":"'+vol+'"}', null, 'Volume','Volume');
  objects.GetObjectByID("923").AddProperty('10464','null',true,'10464','{"FilterGUID":"","FieldID":10464,"Value":"' + LITRES+ '","ByteValue":null,"Decoration":"","Tooltip":"","Text":"Litres"}', null, 'VolumeUOM','Volume UOM');


  objects.Objects[objects.Objects.length - 1].HasChanged = true;
  objects.Save("upsert", false, false, false, false, false, "", "");
}

document.body.addEventListener("PDB_INJECT_DATA", postObject, false);
}




