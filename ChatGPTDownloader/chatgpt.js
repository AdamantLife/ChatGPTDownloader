"use-strict";

/**   GENERAL FUNCTIONS  */

/**
 * Returns whether or not the Chat Log is fully loaded
 * @param {Boolean} [titleLoading=true] - Ensures that the Chat Title
 *      is also loaded and active (the Log may be loaded before the Title)
 * @param {Boolean} [responseLoading=true] - Includes whether ChatGPT
 *      is not currently rendering a response
 * @returns {Boolean} - Returns whether the page is loaded
 */
export function isLoaded(titleLoading=true, responseLoading=true){
    // No Chat Log
    if(!getChatLogElement()) return false;
    // Title must be loaded and there is no Active Chat Title
    if(titleLoading && !getActiveChatTitle()) return false;
    // Is not considered loaded if ChatGPT is rendering a response
    if(responseLoading && isRenderingResponse()) return false;

    return true;
}

/**
 * Returns the GUID for the Chat Log (ID located after *\/chat/*)
 * @returns {String} - The Chat Log's GUID
 */
export function getGUID(){
    // At the moment it's also possible to just take the last segment of href
    let match = /.*(chat|c)\/(?<GUID>[^?/]*?)(?:\/|\?|$)/.exec(window.location.href)
    return !match || match.groups.GUID;
}

/**    CHAT TITLE SIDEBAR FUNCTIONS  
 * 
 *      Chat Titles are hyperlinks (<a></a>) available on the Sidebar.
 *      
 *      In the newest build the sidebar now has an aria label "Chat history".
 *      The list is divided into groups via ol elements and chats are listed
 *      as li elements. We are still using the hyperlink selector for now.
 * 
 *      ChatGPT is typically loaded with no Active Chat;
 * prompting ChatGPT creates a new Active Chat.
 * 
 *      Whenever a new Chat is Activated, the page state is pushed
 * to history and the url updated, but the page is not actually (re)loaded.
 * 
 *      Active Chat now has an ellipse svg next to it (but now ellipse class) inside of a button.
 *      The previously used pen svg has been moved to the "New Chat" button.
*/

/**
 * ChatTitleElements are children of the sidebar and contain a div.text-ellipsis child
 * @typedef {Element} ChatTitleElement
 */

/**
 * Returns a NodeList containing Chat Title Elements
 * @returns {NodeList.<ChatTitleElement>} - The Chat Title Elements
 */
export function getChatTitles(){
    return document.body.querySelectorAll(`[aria-label="Chat history"] li a`);
}

/**
 * Gets the Chat Title Elements on the DOM, filters for an Active Element, and returns the first element, if any
 * @returns {ChatTitleElement | null} - Returns the active Chat Title Element, if any
 */
export function getActiveChatTitle(){
    let titleeles = [...getChatTitles()].filter(chatTitleisActive);
    if(titleeles.length) return titleeles[0];
}

/**
 * Returns whether the given Chat Title Element is the current chat
 * @param {ChatTitleElement} element - The Chat Title Element to check
 * @returns {Boolean} - Whether the Chat Title Element is the current chat
 */
export function chatTitleisActive(element){
    return Boolean(element.nextElementSibling?.querySelector("button"));
}

/**    CHAT LOG FUNCTIONS 
 * 
 *      The Chat Log is nested underneath the #____next Element and consists
 * of a number of child DIVs, each of which represents a line of Dialog. After
 * all the Dialog elements, there is a Spacing DIV used to pad the bottom of
 * the Chat Log
 * 
 *      While the Dialog DIVS have no unique selectors, they have a child DIV
 * with the text-base class which can be used to either select them
 * (div:has(.text-base)) and/or differentiate them from the the Spacing DIV
 * at the end of the Chat Log.
 * 
 *      Inside of each .text-base there is a div.items-end which (after a
 * few more nesting divs) contains the Chatter's Icon and another, nondescriptive
 * div. The second div contains two divs: the first contains the Dialog Text
 * (which uses various HTML Elements for ChatGPT text, but only a single Paragraph
 * element for the User and is selectable via .items-start); the second contains
 * Feedback Icons (edit for User, and thumbs-up/thumbs-down for ChatGPT). The Dialog
 * Text and Feedback Icons for ChatGPT are not immediate children of their respective
 * DIVs but are nested further down.
 * 
 *      At the moment it is only possible for there to be two Chatters in
 * a Chat Log: the User and ChatGPT. While OpenAI's DALL-E includes the User's
 * Username on in the App, only email address is available in ChatGPT at the
 * moment: this is found as the alt attribute on the User's IMG. ChatGPT's Dialog
 * uses an SVG instead of an IMG, which can be used to differentiate between the
 * two Chatters. If, in the future, Username is added to the DOM and multiple Users
 * can enter the same Chat then it may be necessary to deal with duplicate Usernames.
 * 
 *      Chatter Icons are lazy-loaded, which means that they do not fetch their image
 * until they appear on screen and feature a placeholder DataURL until that happens.
*/

/**
 * The ChatLogElement is the direct parent DIV of DialogBlockElements.
 * At the moment, there is no way of selecting it that is more
 * stable/precise than ".pb-9:has(.text-token-text-primary)".
 * .pb-9 is currently unique but the site has changed numerous
 * times so this may not be sufficient in the future.
 * @typedef {Element} ChatLogElement
 */

/**
 * A DialogBlockElement is a DIV that is a direct child to the
 * ChatLogElement and contains a single line of dialog (a prompt
 * from the User or response from ChatGPT). The relevant content
 * is nested a few layers down, but the ChatLog Element is typically
 * used for references because it has the most utility.
 * @typedef {Element} DialogBlockElement
 */

/**
 * Represents Information about a DialogBlockElement's Chatter
 * @typedef {Object} DialogChatterInfo
 * @property {String} name - The User's email address or "ChatGPT"
 * @property {Element} icon - The raw HTML Element used as the Chatter's Icon
 */

/**
 * Returns the Element containing the Chat Log
 * @returns {ChatLogElement} - The direct parent Div of the DialogBlock elements
 */
export function getChatLogElement(){
    // See ChatLogElement typedef for more information about this selector
    return document.querySelector(".pb-9:has(.text-token-text-primary)");
}

/**
 * Returns whether .result-streaming is on the page because ChatGPT is updating its answer
 * @returns {Boolean} - Whether ChatGPT is rendering a prompt Repsonse
 */
export function isRenderingResponse(){
    return Boolean(document.body.querySelector(".result-streaming"))
}

/**
 * Extracts UserInfo 
 * @param {DialogBlockElement} dialogBlock - The DialogBlockElement to get the ChatterInfo from
 * @returns {DialogChatterInfo} - The DialogBlockElement's ChatterInfo
 */
export function getDialogBlockChatter(dialogBlock){
    let chatterdata = {};
    let image = dialogBlock.querySelector("img:not([aria-hidden])");
    if(image){
        chatterdata.name = image.alt;
        chatterdata.icon = image;
    }
    else{
        // SVG's are ChatGPT
        chatterdata.name = "ChatGPT"
        chatterdata.icon = dialogBlock.querySelector("svg");
        
    }
    return chatterdata;
}

/**
 * Retrieves the div.items-start Element from the DialogBlock, which contains the Message
 * @param {DialogBlockElement} - The DialogBlock to retrieve the message from
 * @returns {Element} - The div.items-start containing the displayed message for the DialogBlock
 */
export function getDialogBlockMessage(dialogBlock){
    return dialogBlock.querySelector("div.items-start");
}

/**   THREAD/FORK FUNCTIONS
 * 
 *      When you edit a question in ChatGPT, you create a whole new branch of the conversation
 * which we're refering to as Threads. The DialogBlockElement Index of where these Threads
 * begin we call the Fork.
 * 
 *      Currently, we cannot find where Threads are stored (it is confirmed that there is no
 * Fetch/XHR for them) and therefore we cannot read them without them being dynamically loaded
 * onto the page. There is a slight delay while the background js adds them to the page, which
 * means that functions manipulating Threads need to be implemented asynchronously.
 */

/**
 * Because new Threads are loaded dynamically (and not hidden elements on the page) we use a short
 * transition period for them to be added.
 */
export const THREADTRANSITION = 100

/**
 * An implementation adapted from https://stackoverflow.com/a/33292942 to adapt
 * setTimeout to a Promise with async/await
 * @returns {Promise} - A promise which will resolve into a timeout
 */
export function threadTransitionTimeout(){
    return new Promise((resolve, reject)=>setTimeout(resolve, THREADTRANSITION))
}

/**
 * Return all DialogBlockElements that start new Threads
 * @returns {NodeList} - A list of all DialogBlockElements which start a new Thread
 */
export function getAllThreads(){
    return document.body.querySelectorAll(`.text-base:has(polyline[points="15 18 9 12 15 6"])`);
}

/**
 * Returns whether or not the given DialogBlockElement is the start of a Thread
 * @param {DialogBlockElement} dialogBlock - The DialogBlockElement to check
 * @returns {Boolean} - Whether or not the given Dialog Element is the start of a Thread
 */
export function isStartofThread(dialogBlock){
    return Boolean(getThreadArrow(dialogBlock))
}

/**
 * Returns the desired Thread Arrow Button for the current Thread
 * @param {DialogBlockElement} dialogBlock - An Element with the .text-base class
 * @param {"previous" | "next"} [arrow] - Which arrow to get; defaults to previous for
 *      invalid options.
 * @returns {Element} - The Previous Thread Arrow Button, if the Dialog Element has one
 */
export function getThreadArrow(dialogBlock, arrow){
    // Points that make up the Previous Arrow SVG
    let points = "15 18 9 12 15 6";
    // If next, use the Next Arrow SVG Points
    if(arrow == "next") points = "9 18 15 12 9 6"
    return dialogBlock.querySelector(`button:has(polyline[points="${points}"])`);
}

/**
 * Reverts a Fork to its first Thread
 * @param {DialogBlockElement} dialogBlock - The current DialogBlock at the Fork
 */
export async function setRootThread(dialogBlock){
    let arrow = getThreadArrow(dialogBlock);
    // Arrow is disabled when we reach the Root/First Thread on the Fork
    while(!arrow.disabled){
        arrow.click();
        await threadTransitionTimeout();
    }
}

/**
 * Triggers the Fork's Next Arrow in order to load the next Thread and
 * waits a short time to ensure the next Thread has loaded
 * @param {DialogBlockElement} dialogBlock - The Thread to Increment
 */
export async function incrementThread(dialogBlock){
    getThreadArrow(dialogBlock, "next").click();
    await threadTransitionTimeout();
}