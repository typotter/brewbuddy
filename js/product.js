var ProductLoader = function() {
  this.loadProduct = function(guid) {
    return new Promise(function(resolve, reject) {
      chrome.runtime.sendMessage(
        {action: MSG_ACTIONS.GET, path: '/product/' + guid}, 
        function(data) {
          resolve(new Product(guid, data));
      });
    });
  }
}

var Product = function(guid, data) {
  this.guid = guid;
  this.data = data;


  this.save = function() {
    guid = this.guid;
    var skus = this.skus;
    return new Promise(function(resolve, reject) {
      chrome.runtime.sendMessage(
        {action: MSG_ACTIONS.PUT, path: "/product/" + guid, map: {"skus": skus} }, resolve);
    });
  }
}
