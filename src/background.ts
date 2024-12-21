chrome.runtime.onInstalled.addListener(() => {
   chrome.contextMenus.create({
      id: "sendToExtension",
      title: "Send to Extension",
      contexts: ["selection"],
   });
});

chrome.contextMenus.onClicked.addListener((info) => {
   // Once new selection is sent, remove it from storage
   chrome.storage.local.remove("selectedText", () => {
      console.log("Selected text cleared from storage");
   });
   //  and then again set in storage with new text
   if (info.menuItemId === "sendToExtension" && info.selectionText) {
      chrome.storage.local.set({ selectedText: info.selectionText }, () => {
         chrome.action.openPopup();
      });
   }
});


//background.js
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
       id: "sendToExtension",
       title: "Send to Extension",
       contexts: ["selection"],
    });
 });
 chrome.contextMenus.onClicked.addListener((info) => {
    // Once new selection is sent, remove it from storage
    chrome.storage.local.remove("selectedText", () => {
       console.log("Selected text cleared from storage");
    });
    //  and then again set in storage with new text
    if (info.menuItemId === "sendToExtension" && info.selectionText) {
       chrome.storage.local.set({ selectedText: info.selectionText }, () => {
          chrome.action.openPopup();
       });
    }
 });
 
 
 
