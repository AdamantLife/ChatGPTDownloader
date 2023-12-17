chrome.action.onClicked.addListener(()=>chrome.runtime.openOptionsPage());

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action == "open"){
        chrome.runtime.openOptionsPage();
    }
});