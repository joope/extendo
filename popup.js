// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */

let currentUrl;
let currentTodos = [];
let undone = 0;

function update() {
  renderTodos();
  updateMarkers(undone + '');
  saveTodos();
}

function updateMarkers(text) {
  if(text) {
    chrome.browserAction.setBadgeBackgroundColor({color:[100, 100, 100, 230]});
    chrome.browserAction.setBadgeText({text: text});
  }
}

function getTodos(callback, errorCallback) {
  chrome.storage.local.get(currentUrl, function(items) {
    if(!items || Object.keys(items).length == 0) {
      errorCallback();
      return;
    }
    callback(items[currentUrl]);
  })
}

function saveTodos() {
  if(currentUrl && currentTodos) {
    const todos = {};
    todos[currentUrl] = currentTodos;
    chrome.storage.local.set(todos);
  }
}

function addTodo(content) {
  currentTodos.push({done: false, text: content});
  update();
}

function markDone(target){
  if (currentTodos && target.value) {
    const todo = currentTodos[target.value];
    todo.done = !todo.done;
  }
}

function modifyTodo(target){
  const modify = document.createElement('input');
  modify.type = 'text';
  modify.value = target.outerText;
  modify.addEventListener(function(event){

  })
  target = modify;
  modify.focus();
}

function handleClick(event) {
  console.log(event);
  switch (event.target.localName) {
    case 'input':
      markDone(event.target);
      break;
    case 'li':
      modifyTodo(event.target);
      break;
    default:
      return;
  }

  update();
}

function renderTodos(ordered) {
  if(!currentTodos) {
    renderStatus('No todos found, create a new one');
    return;
  }
  const todos = currentTodos;
  const list = document.createElement('ol');
  undone = 0;

  for (let i=0; i<todos.length; i++) {
    const todo = document.createElement('li');

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.value = i;

    if(todos[i].done) {
      todo.className = 'done';
      check.checked = true;
    } else {
      undone++;
    }

    const text = document.createTextNode(todos[i].text);

    todo.appendChild(check);
    todo.appendChild(text);

    list.appendChild(todo);
  }

  const oldList = document.getElementById('todo-list').firstChild;
  document.getElementById('todo-list').replaceChild(list, oldList);
  renderStatus(currentUrl);
}

function renderStatus(statusText) {
  document.getElementById('info').textContent = statusText;
}

function handleInput(event, type){
  var input = event.target.value;
  if (input && event.keyCode == 13) {
    event.preventDefault();
    event.target.value = '';
    addTodo(input);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('new-todo').addEventListener('keydown', handleInput);
  document.getElementById('todo-list').addEventListener('click', handleClick);
  document.getElementById('new-todo').focus();
  getCurrentTabUrl(function(url) {
    currentUrl = url;
    renderStatus(url);

    getTodos(function(todos) {
      currentTodos = todos;
      renderStatus(currentUrl);
      update();

    }, function(errorMessage) {
      renderStatus('No todos found, create a new one');
      updateMarkers('');
    });
  });
});
