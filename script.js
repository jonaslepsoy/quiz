var session = null;
var namespace = 'urn:x-cast:com.google.cast.quiz';

$(document).ready(function () {
    $('#init').on('click',function(){
       init($('#appid').val()); 
    });
    
});

function init(appid) {
    var loadCastInterval = setInterval(function () {
        if (chrome.cast.isAvailable && appid!='') {
            console.log('Cast has loaded.');
            clearInterval(loadCastInterval);
            initializeCastApi(appid);
        } else {
            if(appid!='') {console.log('Appid Missing!!!')}
            console.log('Unavailable');
        }
    },
    1000);
}

function initializeCastApi(appid) {
    var applicationID = appid;
    var sessionRequest = new chrome.cast.SessionRequest(applicationID);
    var apiConfig = new chrome.cast.ApiConfig(sessionRequest,sessionListener,receiverListener);
    chrome.cast.initialize(apiConfig, onInitSuccess, onInitError);
};

function sessionListener(e) {
    session = e;
    console.log('New session');
    if (session.media.length != 0) {
        console.log('Found ' + session.media.length + ' sessions.');
    }
    session.addUpdateListener(sessionUpdateListener);
    session.addMessageListener(namespace, receiverMessage);
}

function receiverListener(e) {
    if (e === 'available') {
        console.log("Chromecast was found on the network.");
    } else {
        console.log("There are no Chromecasts available.");
    }
}

function onInitSuccess() {
    console.log("Initialization succeeded");
}

function onInitError() {
    console.log("Initialization failed");
}

$('#castme').click(function () {
    launchApp();
});

function launchApp() {
    console.log("Launching the Chromecast App...");
    chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
}

function onRequestSessionSuccess(e) {
    console.log("Successfully created session: " + e.sessionId);
    session = e;
}

function onLaunchError() {
    console.log("Error connecting to the Chromecast.");
}

function onLoadSuccess() {
    console.log('Successfully loaded image.');
}

function onLoadError() {
    console.log('Failed to load image.');
}

$('#stop').click(function () {
    stopApp();
});

function stopApp() {
    session.stop(onStopAppSuccess, onStopAppError);
}

function onStopAppSuccess() {
    console.log('Successfully stopped app.');
}

function onStopAppError() {
    console.log('Error stopping app.');
}

/**
 * send a message to the receiver using the custom namespace
 * receiver CastMessageBus message handler will be invoked
 * @param {string} message A message string
 */
function sendMessage(message) {
    if (session!=null) {
        session.sendMessage(namespace, message, onSuccess.bind(this, "Message sent: " + message), onError);
    }
    else {
        chrome.cast.requestSession(function(e) {
            session = e;
            session.sendMessage(namespace, message, onSuccess.bind(this, "Message sent: " + message), onError);
        }, onError);
    }
}

/**
 * utility function to handle text typed in by user in the input field
 */
function update() {
    sendMessage(document.getElementById("input").value);
}

/**
 * generic success callback
 */
function onSuccess(message) {
    appendMessage("onSuccess: "+message);
}

/**
 * append message to debug message window
 * @param {string} message A message string
 */
function appendMessage(message) {
    console.log(message);
};

/**
 * initialization success callback
 */
function onInitSuccess() {
    appendMessage("onInitSuccess");
}

/**
 * initialization error callback
 */
function onError(message) {
    appendMessage("onError: "+JSON.stringify(message));
}