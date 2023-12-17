"use-strict";

/**
 * The chatgpt.js file is assigned to this name when dynamically imported
 */
var GPT;

/**
 * This is the Local StorageArea key for the Extension
 */
const STORAGENAME = "chatgptsaves";

/**
 * Locks out the Download/Save Buttons while the Extension is
 * executing a Compile->Download/Save sequence
 */
var PARSELOCK = false;

/**
 *     DOWNLOAD FUNCTIONS
 * 
 *      Downloading the currently displayed Chat Log is significantly
 * easier than downloading all Threads within the Chat Log, so two
 * different download methods are used: download and downloadAll respecively.
 * 
 */

/**
 * The Chatter Information outputted by Download Information includes a
 * Base64-encoded DataURL copy of the Chatter's Icon, and the Icon itself
 * is converted to a String.
 * @typedef {Object} ChatterInfoOutput
 * @property {String} name - The Chatter's name
 * @property {String} icon - The Chatter's Icon Element converted to a String
 * @property {String} image - The Chatter's Icon as a Base64 DataURL
 */

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
 * Encodes a Chatter's icon as a Base64 DataURL
 * @param {ChatterInfo} chatter - The Chatter whose icon should be encoded
 * @returns {String} - The Base64-encoded DataURL
 */
async function encodeChatterIcon(chatter){
    if(chatter.icon.tagName == "svg"){
        // XMLSerializer.serializeToString -> String
        let serialized = new XMLSerializer().serializeToString(chatter.icon);
        // Btoa(string)->Base64
        return `data:image/svg+xml;base64,${window.btoa(serialized)}`;
    }
    let url = await fetch(chatter.icon.src)
        .then(resp=> resp.blob())
        .then(blob=> new Promise( (resolve, reject)=> {
            let reader = new FileReader();
            reader.onloadend = ()=>resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        }));
    return url;
}


/**
 * Confrims that a Chatter is cached in the Chatters output and encodes its Icon as ChatterInfo.image
 * @param {ChatterInfo} chatter - The Chatter to check
 * @param {Object.<String, ChatterInfo>} chatters - The Chatters Output object
 */
async function cacheChatter(chatter, chatters){
    // Caching Chatter
    if(typeof chatters[chatter.name] == "undefined"){
        // Don't cache Chatter if their icon hasn't been loaded (src.startsWith "data")
        if(chatter.icon.tagName == "svg" ||!chatter.icon.src.startsWith("data")){
            chatter.image = await encodeChatterIcon(chatter);
            chatter.icon = chatter.icon.outerHTML;
            chatters[chatter.name] = chatter;
        }
    }
}

/**
 * Parses the given DialogBlockElement into the DownloadOutput Object
 * @param {DialogBlockElement} dialogBlock - The DialogBlockElement to parse
 * @param {DownloadOutput} output - The DownloadOutput to mutate
 * @returns {null} - parseDialogBlock mutates the output
 */
async function parseDialogBlock(dialogBlock, output){
    // dialogBlocks have the .text-base element
    // If it doesn't, then this child is the padding element
    // at the end of the ChatLogElement
    if(!dialogBlock.querySelector(".text-base")) return;
    let chatter = GPT.getDialogBlockChatter(dialogBlock);

    await cacheChatter(chatter, output.chatters);
    
    output.chatterlines.push(chatter.name);
    let message = GPT.getDialogBlockMessage(dialogBlock);
    output.dialog.push(message.outerHTML);
    output.strippeddialog.push(message.textContent);
}

/**
 * Compiles the currently displayed Thread for Output
 * @returns {DownloadOutput} - The output data which can be passed
 *                                  to completeDownload or completeSave
 */
async function buildSimpleLog(){
    let GUID = GPT.getGUID();
    let now = new Date()
    let timestamp = now.getTime();
    let title = GPT.getActiveChatTitle();
    if(title) title = title.textContent;
    let chatters = {};
    let chatterlines = [];
    let dialog = [];
    let strippeddialog = [];

    output = {GUID, timestamp, title, chatters, chatterlines, dialog, strippeddialog};
    let log = GPT.getChatLogElement();

    for(let dialogBlock of log.children){
        await parseDialogBlock(dialogBlock, output);
    }

    return output;
}

/**
 * Compiles all Threads in the Chat Log into a single DownloadOutput and returns it
 * @returns {DownloadOutput} - The output data for all threads which
 *                              can be passed to completeDownload or completeSave
 */
async function buildFullLog(){
    let GUID = GPT.getGUID();
    let timestamp =  new Date().getTime();
    let title = GPT.getActiveChatTitle();
    if(title) title = title.textContent;

    let output = {GUID, timestamp, title, chatters: {}, chatterlines: [], dialog:[], strippeddialog: []};

    let log = GPT.getChatLogElement();

    await parseThreads(log.children[0], output);
    
    return output;
}

/**
 * Compiles the currently displayed Thread and intializes a Download
 * to the user's machine
 */
async function download(){
    PARSELOCK = true;
    updateDownloadButtons();
    let output = await buildSimpleLog();
    completeDownload(output);
    PARSELOCK = false;
    updateDownloadButtons();
}

/**
 * Compiles all Threads in the Chat Log into one Output and initializes
 * a Download to the user's machine
 */
async function downloadAll(){
    PARSELOCK = true;
    updateDownloadButtons();
    let output = await buildFullLog();
    completeDownload(output);
    PARSELOCK = false;
    updateDownloadButtons();
}

/**
 * Compiles the currently displayed Thread and saves it to
 * the Extension's Local StorageArea
 */
async function save(){
    PARSELOCK = true;
    updateDownloadButtons();
    let output = await buildSimpleLog();
    await completeSave(output);
    PARSELOCK = false;
    updateDownloadButtons();
}

/**
 * Compiles all Threads in the Chat Log into one Output and save
 * it to the Extension's Local StorageArea
 */
async function saveAll(){
    PARSELOCK = true;
    updateDownloadButtons();
    let output = await buildFullLog();
    await completeSave(output);
    PARSELOCK = false;
    updateDownloadButtons();
}


/**
 * Processes a DialogBlockElement and handles 
 * @param {DialogBlockElement} dialogBlock - The DialogBlockElement to process
 * @param {DownloadOutput} output - The DownloadOutput for the current thread
 * @returns {DownloadOutput} - This function mutates the output in place and returns it
 */
async function parseThreads(dialogBlock, output){
    if(!dialogBlock || !dialogBlock.querySelector(".text-base")) return output;    

    // If this is not a Fork, we can just recurse
    if(!GPT.isStartofThread(dialogBlock)){
        await parseDialogBlock(dialogBlock, output);
        return await parseThreads(dialogBlock.nextElementSibling, output);
    }
    
    // If this is a Fork, each Thread of the Fork will recurse independantly

    // We need previous because we lose our current DialogBlockElement
    // when we setRootThread or incrementThread
    let previous = dialogBlock.previousElementSibling;

    await GPT.setRootThread(dialogBlock);

    // At a fork, the value at the array index is a sub array
    let allchatterslines = [], alldialog = [], allstrippeddialog = [];
    output.chatterlines.push(allchatterslines);
    output.dialog.push(alldialog);
    output.strippeddialog.push(allstrippeddialog);

    // The first Thread is never last (otherwise it wouldn't be a Fork)
    let isLast = false

    while(!isLast){
        // Get current Thread Element
        if(previous){
            dialogBlock = previous.nextElementSibling;
        }else{ // This thread may be the very first DialogBlockElement
            dialogBlock = GPT.getChatLogElement().children[0]
        }

        // It's easiest to create a sub output
        let sub = {GUID: output.GUID, timestamp:output.timestamp, title: output.title, chatters: output.chatters, chatterlines: [], dialog: [], strippeddialog: []}
        await parseDialogBlock(dialogBlock, sub);
        await parseThreads(dialogBlock.nextElementSibling, sub);
        
        // And then add the sub output back into the parent output
        allchatterslines.push(sub.chatterlines);
        alldialog.push(sub.dialog);
        allstrippeddialog.push(sub.strippeddialog);

        isLast = GPT.getThreadArrow(dialogBlock, "next").disabled;
        if(!isLast) await GPT.incrementThread(dialogBlock);
    }

    return output;
}


/**
 * Initializes the actual download to the User's computer once
 * a download function has finished gathering whatever information
 * it needs
 * @param {DownloadOutput} output - The Log to download
 */
function completeDownload(output){
    document.body.insertAdjacentHTML('beforeend', `<a id="chatlogDownload" href="data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(output))}" download="${output.title} Chat Log - ${new Date(output.timestamp).toLocaleString()}.json"></a>`);
    let a = document.getElementById("chatlogDownload");
    a.click();
    a.remove();
    let al = document.getElementById("alert");
    al.textContent = "Chat Log Download Started";
    al.classList.add("shown");
}

/**
 * Saves the Chat Log to the  Extension's Local StorageArea
 * @param {DownloadOutput} output - The Log to save to the Extension's storage
 * @returns {Promise} - The Local StorageArea.set Promise
 */
async function completeSave(output){
    return chrome.storage.local.get(STORAGENAME)
        .then(results=>results[STORAGENAME])
        .then(results=>{
            if(!results || typeof results == "undefined") results = [];
            results.push(output);
            return chrome.storage.local.set({[STORAGENAME]:results})
        }).then(set=>{
            let al = document.getElementById("alert");
            al.textContent = "Chat Log Saved";
            al.style.cursor = "pointer";
            al.onclick = ()=>chrome.runtime.sendMessage({action:"open"});
            al.classList.add("shown");
            return set;
        });
}

/**    USER INTERFACE FUNCTIONS */

/**
 * Sets up the Download Button on the DOM
 */
function setupDownloadButtons(){
    document.getElementById("__next").insertAdjacentHTML('beforebegin', `<div id="alert" class="top"></div><div id="downloads" class="top"><span id="downloadexpand"></span><div id="downloadbuttons">
    <div class="nowrap">
        <button id="downloadbutton" class="download" disabled>Download Displayed Thread</button>
        <button id="downloadallbutton" class="download" disabled>Download All Threads</button>
    </div>
    <div class="nowrap">
        <button id="savebutton" class="download" disabled>Save Displayed Thread</button>
        <button id="saveallbutton" class="download" disabled>Save All Threads</button>
    </div>
</div></div>
<style>
    div.top{
        position:absolute;
        z-index:100;
        top:5px;
    }

    #alert{
        display:none;
        opacity:0;
        left: 50%;
        transform:translateX(-50%);
        color: white;
        background-color:red;
        border: 3px outset red;
        border-radius: .5em;
        padding:3px;
    }

    #alert.shown{
        display:revert;
    }

    #alert.shown{
        animation: fadecycle 3s linear 1;
    }

    @keyframes fadecycle{
        0% { opacity: 0; }
        40% { opacity: 1; }
        60% { opacity: 1; }
        100% { opacity: 0; }
    }

    #downloads{
        right:10px;
        padding: 3px;
        background-color:white;

        box-shadow: 4px 4px 6px -1px rgba(0,0,0,0.75);
        -webkit-box-shadow: 4px 4px 6px -1px rgba(0,0,0,0.75);
        -moz-box-shadow: 4px 4px 6px -1px rgba(0,0,0,0.75);
    }

    #downloadexpand{
        display:block;
        cursor:pointer;
        width: 1.5em;
        height:1.5em;
        font-family: monospace;
        font-size:1em;
        text-align:center;
        background-color:bisque;
        border: 1px solid black;
        border-radius:50%;
        margin:2px;
    }
    #downloadexpand:after{
        content:"⯈";
    }
    #downloadexpand:has(+#downloadbuttons.shown):after{
        content:"⯆";
    }
    #downloadbuttons{
        max-width:0px;
        max-height:0px;
        overflow:hidden;
        transition: max-width 1s, max-height 1s;
    }
    #downloadbuttons.shown{
        max-width:1000px;
        max-height:1000px;
    }
    
    div.nowrap{
        overflow:hidden;
        white-space:nowrap;
    }
    button.download{
        background-color:revert;
        background-image:revert;
        border:revert;
    }
</style>`);
    document.getElementById("alert").addEventListener("animationend", (event)=>{event.target.classList.remove('shown'); event.target.textContent = ""; event.target.style.cursor = "auto";event.target.onclick = null;});
    document.getElementById("downloadexpand").onclick = ()=>document.getElementById("downloadbuttons").classList.toggle("shown");
    document.getElementById("downloadbutton").onclick = download;
    document.getElementById("downloadallbutton").onclick = downloadAll;
    document.getElementById("savebutton").onclick = save;
    document.getElementById("saveallbutton").onclick = saveAll;
}

/**
 * Watches the #__next div for changes and updates the Download Button appropriately
 * @param {MutationRecord[]} mutations- Mutations active on the target
 */
function updateDownloadButtons(mutations){
    // __next may not have existed when content script
    // is loaded, so buttons will need to be set up now
    if(!document.getElementById("downloadbutton") &&
        document.getElementById("__next")) setupDownloadButtons();
    let _isLoaded = GPT.isLoaded();
    // Buttons should be disabled before the page is fully loaded/updated and while the PARSELOCK is on
    document.querySelectorAll("#downloadbuttons button.download").forEach(ele=>ele.disabled = !_isLoaded || PARSELOCK);
}


/**
 * Watches the page for changes and disables the Download Buttons if the
 * Chat Log is not loaded or begins updating
 * @type {MutationObserver}
 */
var WATCHER;

/**
 * Sets up the Download Buttons if possible as well as a  MutationObserver
 * to manage their state and run their setup at a later time if they cannot
 * be setup immediately
 */
function setup(){
    // __next may not exist when content script is loaded
    if(document.getElementById("__next")) setupDownloadButtons();
    let options = {
        subtree: true,
        childList: true
    };
    WATCHER = new MutationObserver(updateDownloadButtons);
    // div#__next is not available to watch on page load
    // we're just watching body instead of delaying until 
    // div#__next is loaded
    WATCHER.observe(document.body, options);
}

(async ()=>{
    // Workaround to import ChatGPT since it cannot be imported directly
    let extURL = chrome.runtime.getURL("chatgpt.js");
    GPT = await import(extURL);
    setup();
})();