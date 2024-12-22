chrome.runtime.onInstalled.addListener(() => {
   chrome.contextMenus.create({
      id: "sendToExtension",
      title: "Send to ResumeOnFly",
      contexts: ["selection"],
   });
});

chrome.contextMenus.onClicked.addListener((info) => {
   if (info.menuItemId === "sendToExtension" && info.selectionText) {
      // Clear both stored text and analysis when new text is selected
      chrome.storage.local.remove(["selectedText", "storedAnalysis"], () => {
         // Then set new selected text
         chrome.storage.local.set({ selectedText: info.selectionText }, () => {
            chrome.action.openPopup();
         });
      });
   }
});

// chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
//    if (message.type === "checkLoginStatus") {
//       chrome.storage.local.get("isLoggedIn", (result) => {
//          const isLoggedIn = result.isLoggedIn;
//          sendResponse({ isLoggedIn: !!isLoggedIn });
//       });
//       return true; // Keep the message channel open for async response
//    }
// });
