/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */

function Todo(text, done) {
 this.text = text;
 this.done = done;

 this.markDone = function(done) {
   this.done = done;
 }

 this.modify = function(newText) {
   this.text = newText;
 }

 this.render = function(index) {
   const todo = document.createElement('li');
   todo.dataset.id = index;

   const check = document.createElement('input');
   check.type = 'checkbox';
   check.value = index;

   const remove = document.createElement('button');
   remove.innerHTML = 'X';
   remove.value = index;

   if (this.done) {
     todo.className = 'done';
     check.checked = true;
   }

   const text = document.createTextNode(this.text);

   todo.appendChild(check);
   todo.appendChild(text);
   todo.appendChild(remove);
   return todo;
 }
}

function TodoList(url) {
 this.todos = [];
 this.done = 0;
 this.url = url;
 this.modified;

 this.update = function() {
   this.render(this.todos);
   this.save();
 }

 this.doneToString = function() {
   return this.done + '/' + this.todos.length;
 }

 this.addTodo = function(name, done) {
   this.todos.push(new Todo(name, done));
   if (done) {
     this.done++;
   }
 }

 this.addTodos = function(todos) {
   for (let i in todos) {
     this.addTodo(todos[i].text, todos[i].done);
   }
 }

 this.removeTodo = function(index) {
   if (this.todos[index].done) {
     this.done--;
   }
   this.todos.splice(index, 1);
 }

 this.modifyTodo = function(index) {
   this.modified = index;
 }

 this.doneModifying = function(newText) {
   if(this.modified && newText) {
     this.todos[this.modified].modify(newText);
     this.modified = null;
   }
 }

 this.markDone = function(index) {
   const todo = this.todos[index];
   if(todo) {
     if (todo.done) {
       todo.markDone(false);
       this.done--;
     } else {
       todo.markDone(true);
       this.done++;
     }
   }
 }

 this.save = function() {
   const todos = {};
   todos[this.url] = this.todos;
   chrome.storage.local.set(todos);
 }

 this.fetchTodos = function(setBadge) {
   chrome.storage.local.get(this.url, (items) => {
     console.log(items);
     if (!items || Object.keys(items).length == 0) {
       setBadge('');
       return;
     }
     this.addTodos(items[this.url]);
     this.render(this.todos);
     setBadge(this.doneToString());
   });
 }

 this.render = function(todos) {
   const list = document.createElement('ol');

   for (let i = 0; i < todos.length; i++) {
     if(this.modified == i) {
       const input = document.createElement('input');
       const todo = document.createElement('li');
       input.type = 'text';
       input.value = this.todos[i].text;
       input.id = 'modifying';
      //  input.style.width = input.value.length + 'em'};
       input.addEventListener('keydown', (event) => {
         var input = event.target.value;
         if (input && event.keyCode == 13) {
           event.preventDefault();
           this.doneModifying(input);
           this.update();
         }
       })
       todo.appendChild(input);
       list.appendChild(todo);
     } else {
       list.appendChild(todos[i].render(i));
     }

   }

   const oldList = document.getElementById('todo-list').firstChild;
   document.getElementById('todo-list').replaceChild(list, oldList);
   if (document.getElementById('modifying')) {
     document.getElementById('modifying').focus();
   }
 }
}

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

let currentUrl;
let todolist;

function update() {
  todolist.update();
  updateMarkers(todolist.doneToString());
}

function updateMarkers(text) {
  chrome.browserAction.setBadgeBackgroundColor({color:[100, 100, 100, 230]});
  chrome.browserAction.setBadgeText({text: text});
}

function addTodo(content) {
  todolist.addTodo(content, false);
  update();
}

function markDone(target){
  console.log(target);
  if (todolist && target.value) {
    todolist.markDone(target.value);
    todolist.save();
  }
}

function removeTodo(target) {
  console.log(target);
  if (todolist && target.value) {
    todolist.removeTodo(target.value);
    todolist.update();
  }
}

function modifyTodo(target){
  //modify target index
  console.log(target);
  todolist.modifyTodo(target.dataset.id);
  todolist.update();
}

function handleClick(event) {
  console.log(event);
  switch (event.target.localName) {
    case 'input':
      markDone(event.target);
      update();
      break;
    case 'li':
      modifyTodo(event.target);
      break;
    case 'button':
      removeTodo(event.target);
      update();
    default:
      return;
  }
  //update();
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
    todolist = new TodoList(url);
    todolist.fetchTodos(updateMarkers);
  });
});
