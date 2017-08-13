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
    updateMarkers(done, total);
  });
}

function updateMarkers(done, total) {
  if (done == 0 && total > 0) {
    chrome.browserAction.setBadgeBackgroundColor({color:[220, 0, 0, 255]});
  } else if (done > 0 && done !== total) {
    chrome.browserAction.setBadgeBackgroundColor({color:[200, 200, 100, 255]});
  } else if (done !== 0 && done == total){
    chrome.browserAction.setBadgeBackgroundColor({color:[0, 200, 0, 255]});
  } else {
    chrome.browserAction.setBadgeBackgroundColor({color:[120, 120, 120, 255]});
  }
  const text = `${done}/${total}`;
  chrome.browserAction.setBadgeText({text: text});
}


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
