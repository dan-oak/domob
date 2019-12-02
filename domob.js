// ==UserScript==
// @name domob
// @namespace doit
// @description DOM Observer - Select and observe a page element and execute functions on changes
// @version 1.0
// @match *://*/*
// @grant none
// ==/UserScript==

console.log("Initializing domob")

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    // source: https://stackoverflow.com/a/8809472/2601742
}

var/*string*/uuidOfRun = generateUUID()

document.body.addEventListener("contextmenu", initMenu, false)

let/*object*/observers = {} // Map[id : string, observer : MutationObserver]

function initMenu(event) {
    console.log("Initializing menu for " + event.localName)
    let/*string*/contextMenuId = event.target.getAttribute("contextmenu")
    if (contextMenuId !== null) {
      console.log("domob: Cannot yet handle the case when context menu for" +
        " element is already present. It could already be initialized by me" +
        " in which case please just ignore this message.")
      return
    }
    let/*string*/menuId = getDomPath(event.target).join('-') + uuidOfRun
    let/*Element*/menu = document.getElementById(menuId)
    if (menu === null) {
      /*Element*/menu = document.createElement("menu")
      menu.setAttribute("id", menuId)
      menu.setAttribute("type", "context")
      let/*Element*/observerItem = document.createElement("menuitem")
        observerItem.setAttribute("label", "Set Observer")
        observerItem.target = event.target
        observerItem.addEventListener("click", observe)
      menu.appendChild(observerItem)
      event.target.appendChild(menu)
      event.target.setAttribute("contextmenu", menuId)
    }
}

function observe(event) {
  console.log("Hey ")
  console.log(event.target.target)
  if (Notification.permission !== "denied") {
    Notification.requestPermission()
  }
  let/*object*/config = {
    attributes: true,
    childList: true,
    subtree: true,
  }
  let/*function*/callback = function(mutations, observer) {
    for (let mutation of mutations) {
      if (mutation.type == 'childList') {
        console.log('A child node has been added or removed.');
        new Notification('A child node has been added or removed.')
      }
      else if (mutation.type == 'attributes') {
        console.log('The ' + mutation.attributeName + ' attribute was modified.');
        new Notification('The ' + mutation.attributeName + ' attribute was modified.')
      }
    }
  };
  // Create an observer instance linked to the callback function
  let/*MutationObserver*/observer = new MutationObserver(callback);
  // Start observing the target node for configured mutations
  observer.observe(event.target.target, config);
  onRemove(event.target.target, () => {
    new Notification('Node has been removed')
  })
}

function onRemove(element, onDetachCallback) {
    let observer = new MutationObserver(function () {
        function isDetached(el) {
            if (el.parentNode === document) {
                return false;
            } else if (el.parentNode === null) {
                return true;
            } else {
                return isDetached(el.parentNode);
            }
        }
        if (isDetached(element)) {
            observer.disconnect();
            onDetachCallback();
        }
    })
    observer.observe(document, { childList: true, subtree: true });
}

function getDomPath(el) {
  var stack = [];
  while ( el.parentNode != null ) {
    var sibCount = 0;
    var sibIndex = 0;
    for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
      var sib = el.parentNode.childNodes[i];
      if ( sib.nodeName == el.nodeName ) {
        if ( sib === el ) {
          sibIndex = sibCount;
        }
        sibCount++;
      }
    }
    if ( el.hasAttribute('id') && el.id != '' ) {
      stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
    } else if ( sibCount > 1 ) {
      stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
    } else {
      stack.unshift(el.nodeName.toLowerCase());
    }
    el = el.parentNode;
  }
  return stack.slice(1); // removes the html element
  // source: // https://stackoverflow.com/a/16742828/2601742
}