/**
 * This is the Local StorageArea key for the Extension
 */
const STORAGENAME = "chatgptsaves";

const ICONHTML = `<div class="w-[30px] flex flex-col relative items-end"></div>`

const USERICONHTML = `
<div class="relative flex">
    <span data-user style="box-sizing: border-box; display: inline-block; overflow: hidden; width: initial; height: initial; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px; position: relative; max-width: 100%;">
        <span style="box-sizing: border-box; display: block; width: 30px; height: 30px; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px; max-width: 100%;">
            <img alt="" aria-hidden="true" src="data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%2730%27%20height=%2730%27/%3e" style="display: block; max-width: 100%; width: initial; height: initial; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px;">
        </span>
        <!-- User Image goes Here -->
    </span>
</div>`

const CHATGPTICONHTML = `<div data-user class="relative h-[30px] w-[30px] p-1 rounded-sm text-white flex items-center justify-center" style="background-color: rgb(16, 163, 127);"></div>`

const THREADNAVHTML = `<div class="text-xs flex items-center justify-center gap-1 invisible absolute left-0 top-2 -ml-4 -translate-x-full group-hover:visible">
    <button data-threadprev class="dark:text-white disabled:text-gray-300 dark:disabled:text-gray-400">
        <svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    </button>
    <span class="flex-grow flex-shrink-0"><span data-threadcurrent></span>/<span data-threadmax></span></span>
    <button data-threadnext class="dark:text-white disabled:text-gray-300 dark:disabled:text-gray-400">
        <svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    </button>
</div>`;

const DIALOGBLOCKHTML = `<div class="w-full border-b border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group dark:bg-gray-800"><div class="text-base gap-4 md:gap-6 m-auto md:max-w-2xl lg:max-w-2xl xl:max-w-3xl p-4 md:py-6 flex lg:px-0"></div></div>`;

/**
 * The Chat Log information gathered and downloaded to the user's computer.
 * For "full" downloads (output all threads), chatterlines, dialog, and
 * strippeddialog contain subarrays at indices where the Chat Log forks.
 * 
 * @typedef {Object} DownloadOutput
 * @property {"simple" | "full"} type - The type of Download (either 
 *      only the displayed thread, or all threads, respectively)
 * @property {String} GUID - The Chat Log's GUID
 * @property {String} timestamp - The timestamp that the Download File was Generated
 * @property {String} title - The Chat Log's Title
 * @property {Object.<String, ChatterInfoOutput>} chatters - A collection of
 *      the Chatters involved in the Chat Log
 * @property {String[]} chatterlines - an Array of Chatter Names
 *      corresponding to each DialogBlock
 * @property {String[]} dialog - an Array of the DialogBlockElements
 *      converted to strings
 * @property {String[]} strippeddialog - An Array of the DialogBlockElements
 *      textContent
 */

/**
 * Fetches the saved Chat Logs from the Extension's Local StorageArea
 * and loads them onto the Menu page
 * @returns {Promise} - The resolution of loadChatLogs
 */
async function getLoadChatLogs(){
    return chrome.storage.local.get(STORAGENAME)
        .then(results=>results[STORAGENAME])
        .then(results=>loadChatLogs(results));
}

/**
 * Populates the Menu's Saved Table with DownloadOutput listings
 * @param {DownloadOutput[]} results - The DownloadOutputs retrieved by storage.local.get
 */
function loadChatLogs(results){
    let tbody = document.getElementById("saved");
    while(tbody.lastElementChild) tbody.lastElementChild.remove();
    if(!results || typeof results == "undefined") return;
    results.sort((a,b)=>(""+a.GUID).localeCompare(b.GUID+"")).sort((a,b)=>b.timestamp - a.timestamp);
    for(let downloadOutput of results){
        tbody.insertAdjacentHTML('beforeend', `<tr data-guid="${downloadOutput.GUID}" data-timestamp="${downloadOutput.timestamp}">
    <td title="Open">${downloadOutput.title}</td>
    <td>${new Date(downloadOutput.timestamp).toLocaleString()}</td>
    <td data-save title="Download"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
  </svg></td>
    <td data-trash title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
  </svg></td>
</tr>`);
        tbody.lastElementChild.querySelector(`[title="Open"]`).onclick = ()=>openLog(downloadOutput.GUID, downloadOutput.timestamp);
        tbody.lastElementChild.querySelector("[data-trash]").onclick = ()=>deleteLog(downloadOutput.GUID, downloadOutput.timestamp);
        tbody.lastElementChild.querySelector("[data-save]").onclick = ()=>downloadLog(downloadOutput.GUID, downloadOutput.timestamp);

    }
}

/**
 * Retrieves Saved Chat Logs from the Extension's Local StorageArea and searches them for
 * a Chat Log with a matching GUID and timestamp, returning the result and the array of Chat Logs
 * @param {String} guid - The Chat Log GUID to open
 * @param {*} timestamp - The timestamp that Chat Log was saved
 * @returns {Promise<[DownloadOutput|null, DownloadOutput[]]>} - A Promise whose resolution
 *                          returns the given log (if it is found) and all saved Chat Logs
 */
async function findLog(guid, timestamp){
    return chrome.storage.local.get(STORAGENAME)
        .then(results=>results[STORAGENAME])
        .then(results=> [results.find(log=>log.GUID == guid && log.timestamp == timestamp),results]);
}

async function openLog(guid, timestamp){
    let [log] = await findLog(guid, timestamp);
    loadLog(log);
}

/**
 * Deletes the Chat log that was clicked
 * @param {String} guid - The Chat Log GUID to delete
 * @param {String} timestamp - The timestamp that Chat Log was saved
 * @returns {Promise} - Returns getLoadChatLogs' Promise
 */
async function deleteLog(guid, timestamp){
    let [log, results] = await findLog(guid, timestamp);
    if(!log) return;
    let index = results.indexOf(log);
    results.splice(index, 1);
    return chrome.storage.local.set({[STORAGENAME]: results})
            .then(promise=>getLoadChatLogs());
}

/**
 * Initializes a download of the Chat Log to the user's machine
 * @param {String} guid - The Chat Log GUID to download
 * @param {String} timestamp - The timestamp that the Chat Log was saved
 */
async function downloadLog(guid, timestamp){
    let [log] = await findLog(guid, timestamp);
    let a = document.getElementById("chatlogDownload");
    a.href=`data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(log))}`;
    a.download=`${log.title} Chat Log - ${new Date(log.timestamp).toLocaleString()}.json`;
    a.click();
}

/**
 * Displays the Chat Log page and loads the Saved Chat Log into it
 * @param {DownloadOutput} downloadOutput - The Chat Log to load
 */
function loadLog(downloadOutput){
    document.title = `${downloadOutput.title} - ${new Date(downloadOutput.timestamp).toLocaleString()}`;
    document.getElementById("chat").style.display = "revert";
    document.getElementById("menu").style.display = "none";

    document.getElementById("chattitle").textContent = downloadOutput.title;
    document.getElementById("chatdate").textContent = new Date(downloadOutput.timestamp).toLocaleString();
    let chatlog = document.getElementById("chatlog")
    while(chatlog.lastElementChild) chatlog.lastElementChild.remove();

    loadThread(chatlog, downloadOutput.chatterlines, downloadOutput.dialog, downloadOutput.chatters);
}

/**
 * 
 * @param {Element} parent - The Element to add this Thread to
 * @param {DownloadOutput.chatterlines} chatterlines - The corresponding Chatter name for each line
 * @param {DownloadOutput.dialog} dialog - The saved DialogBlockElement strings for the Chat Log
 * @param {DownloadOutput.chatters} chatters - The Chatters lookup for the Chat Log
 * @param {Boolean} skipFirst - Used when navigating between threads in order to skip the Fork DialogBlock
 */
function loadThread(parent, chatterlines, dialog, chatters, skipFirst=0){
    for(let i = 0+skipFirst; i < chatterlines.length; i++){
        
        parent.insertAdjacentHTML('beforeend', DIALOGBLOCKHTML);
        let block = parent.lastElementChild.children[0];

        // Setup Icon
        block.insertAdjacentHTML('beforeend', ICONHTML);

        let chatterline = chatterlines[i];
        if(chatterline.constructor.name != "Array"){
            let chatter = chatters[chatterline];

            // ChatGPT and User use two different HTML trees
            if(chatter.name == "ChatGPT") block.lastElementChild.insertAdjacentHTML('beforeend', CHATGPTICONHTML);
            else block.lastElementChild.insertAdjacentHTML('beforeend', USERICONHTML);

            // In this implementation, both have the same selector for ease of use
            let userdiv = block.querySelector("[data-user]");

            userdiv.insertAdjacentHTML('beforeend', chatter.icon);

            // Users need to have their icon adjusted to use the Encoded Image
            if(chatter.name != "ChatGPT"){
                // User icon needs to be modified
                let img = userdiv.lastElementChild;
                img.removeAttribute("srcset");
                img.src = chatter.image;
            }else{
                // For "Save to PDF" purposes, we're adding in an img version
                userdiv.insertAdjacentHTML('beforeend', `<div class="printout"><img alt="ChatGPT" src="${chatter.image}" /></div>`);
            }
        }

        // Setup Message
        let dialogBlock = dialog[i];
        if(dialogBlock.constructor.name == "Array"){
            block.lastElementChild.insertAdjacentHTML('beforeend', THREADNAVHTML);
            let threadcurrent = block.querySelector("[data-threadcurrent]");
            threadcurrent.textContent = "1";
            block.querySelector("[data-threadmax]").innerText = dialogBlock.length;
            let threadprev = block.querySelector("[data-threadprev]");
            threadprev.disabled = true;

            threadprev.onclick = ()=>changeThread(block, {dialog: dialogBlock, chatterlines: chatterlines[i], chatters}, -1);
            block.querySelector("[data-threadnext]").onclick = ()=>changeThread(block, {dialog: dialogBlock, chatterlines: chatterlines[i], chatters}, +1);

            block.insertAdjacentHTML('beforeend', "<div></div>");

            changeThread(block, {dialog: dialogBlock, chatterlines: chatterlines[i], chatters}, 0);

        }else{
            block.insertAdjacentHTML("beforeend", dialogBlock);
        }
    }
}

function changeThread(block, {dialog, chatterlines, chatters}, modifier){    
    let currentthread = block.querySelector("[data-threadcurrent]");

    let threadnumber = parseInt(currentthread.textContent);
    let maxthreadnumber = parseInt(block.querySelector("[data-threadmax]").textContent);

    if(threadnumber == 1 && modifier == -1) return;
    else if(threadnumber == maxthreadnumber && modifier == 1) return;
    
    threadnumber += modifier;
    block.querySelector("[data-threadprev").disabled = threadnumber == 1;
    block.querySelector("[data-threadnext").disabled = threadnumber == maxthreadnumber;
    currentthread.innerText = threadnumber;
    while(block.parentElement.nextElementSibling) block.parentElement.nextElementSibling.remove();
    
    chatterlines = chatterlines[threadnumber-1]
    dialog = dialog[threadnumber-1];

    block.lastElementChild.remove();
    block.insertAdjacentHTML("beforeend", dialog[0]);

    loadThread(block.parentElement.parentElement, chatterlines, dialog, chatters, 1);
}

function showMainMenu(){
    document.title = "ChatGPT Downloader"
    document.getElementById("chat").style.display = "none";
    document.getElementById("menu").style.display = "revert";
}

function showScrollTop(event){
    let scrolltop = document.getElementById("scrolltop");
    if(document.body.scrollTop > 20 || document.documentElement.scrollTop > 20){
        scrolltop.style.display = "block";
        scrolltop.style.opacity = 1;
    }
    else{
        scrolltop.style.opacity = 0;
    }
}

function hideScrollTop(event){
    let scrolltop = document.getElementById("scrolltop");
    if(!scrolltop.style.opacity) scrolltop.style.display = "none";
}

(()=>{
    showMainMenu();
    getLoadChatLogs();
    document.querySelector("#exitchat>button").onclick = showMainMenu;
    document.querySelector("#print>button").onclick = ()=>print();
    document.querySelector("#scrolltop>button").onclick = ()=>{document.body.scrollTop = 0; document.documentElement.scrollTop = 0;}
    document.querySelector("#scrolltop").addEventListener("transitionend", hideScrollTop);
    window.onscroll = showScrollTop;
})();