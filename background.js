function checkTodos(url) {
  chrome.storage.local.get(this.url, (items) => {
    console.log(items, url);
    items = items[url];
    if (!items || Object.keys(items).length == 0) {
      chrome.browserAction.setBadgeText({text: ''});
      return;
    }
    let total = items.length;
    let done = 0;

    for (var i in items) {
      if (items[i].done) {
        done++;
      }
    }
    const badgeText = done + '/' + total;
    chrome.browserAction.setBadgeText({text: badgeText});
  });
}

chrome.browserAction.setBadgeBackgroundColor({color:[100, 100, 100, 230]});
chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo, tab){
    checkTodos(tab.url);
  }
);
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    checkTodos(tab.url);
  });
});
chrome.tabs.onCreated.addListener(
  function(tab){
    checkTodos(tab.url);
  }
);
