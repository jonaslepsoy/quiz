var session = null;
var namespace = 'urn:x-cast:com.google.devrel';
var activity = {status:'disconnected'};


$(document).ready(function () {
    $('#init').on('click',function(){
       init($('#appid').val());
    });

    $('#castme').click(function () {
        console.log('yes');
        launchApp();
    });

    $('#stop').click(function () {
        stopApp();
    });

    $('#startgame').click(function () {
        var message = {
            message: {
                type: 'command',
                command: 'startGame'
            }
        }
        sendMessage(message);
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
        $("#init").hide();
        $("#castme").show();
        $("#stop").hide();
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

function launchApp() {
    console.log("Launching the Chromecast App...");
    chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
}

function onRequestSessionSuccess(e) {
    console.log("Successfully created session: " + e.sessionId);
    session = e;
    $("#castme").hide();
    $("#stop").show();
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

function stopApp() {
    session.stop(onStopAppSuccess, onStopAppError);
}

function onStopAppSuccess() {
    $("#castme").show();
    $("#stop").hide();
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
    console.log(JSON.stringify(message));
    appendMessage("onError: "+JSON.stringify(message));
}




/* HELLO VIDEO */
/**
 * Cast initialization timer delay
 **/
var CAST_API_INITIALIZATION_DELAY = 1000;
/**
 * Progress bar update timer delay
 **/
var PROGRESS_BAR_UPDATE_DELAY = 1000;
/**
 * Session idle time out in miliseconds
 **/
var SESSION_IDLE_TIMEOUT = 300000;
/**
 * Media source root URL
 **/
var MEDIA_SOURCE_ROOT =
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/';

// Cast icon thumbnail active
var CAST_ICON_THUMB_ACTIVE = 'images/cast_icon_active.png';
// Cast icon thumbnail idle
var CAST_ICON_THUMB_IDLE = 'images/cast_icon_idle.png';
// Cast icon thumbnail warning
var CAST_ICON_THUMB_WARNING = 'images/cast_icon_warning.png';

/**
 * global variables
 */
var currentMediaSession = null;
var currentVolume = 0.5;
var progressFlag = 1;
var mediaCurrentTime = 0;
var session = null;
var storedSession = null;
var mediaURLs = [
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/ED_1280.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/tears_of_steel_1080p.mov',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/reel_2012_1280x720.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/Google%20IO%202011%2045%20Min%20Walk%20Out.mp3'];
var mediaTitles = [
    'Big Buck Bunny',
    'Elephant Dream',
    'Tears of Steel',
    'Reel 2012',
    'Google I/O 2011 Audio'];

var mediaThumbs = [
    'images/BigBuckBunny.jpg',
    'images/ElephantsDream.jpg',
    'images/TearsOfSteel.jpg',
    'images/reel.jpg',
    'images/google-io-2011.jpg'];
var currentMediaURL = mediaURLs[0];
var currentMediaTitle = mediaTitles[0];
var currentMediaThumb = mediaThumbs[0];

var timer = null;


/**
 * load media specified by custom URL
 */
function loadCustomMedia() {
  var customMediaURL = document.getElementById('customMediaURL').value;
  if (customMediaURL.length > 0) {
    loadMedia(customMediaURL);
  }
}

/**
 * load media
 * @param {string} mediaURL media URL string
 * @this loadMedia
 */
function loadMedia(mediaURL) {
  if (!session) {
    console.log('no session');
    appendMessage('no session');
    return;
  }

  if (mediaURL) {
    var mediaInfo = new chrome.cast.media.MediaInfo(mediaURL);
    currentMediaTitle = 'custom title needed';
    currentMediaThumb = 'images/video_icon.png';
    document.getElementById('thumb').src = MEDIA_SOURCE_ROOT +
        currentMediaThumb;
  }
  else {
    console.log('loading...' + currentMediaURL);
    appendMessage('loading...' + currentMediaURL);
    var mediaInfo = new chrome.cast.media.MediaInfo(currentMediaURL);
  }
  mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
  mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
  mediaInfo.contentType = 'video/mp4';

  mediaInfo.metadata.title = currentMediaTitle;
  mediaInfo.metadata.images = [{'url': MEDIA_SOURCE_ROOT + currentMediaThumb}];

  var request = new chrome.cast.media.LoadRequest(mediaInfo);
  request.autoplay = true;
  request.currentTime = 0;

  session.loadMedia(request,
    onMediaDiscovered.bind(this, 'loadMedia'),
    onMediaError);

}

/**
 * callback on success for loading media
 * @param {string} how info string from callback
 * @param {Object} mediaSession media session object
 * @this onMediaDiscovered
 */
function onMediaDiscovered(how, mediaSession) {
  console.log('new media session ID:' + mediaSession.mediaSessionId);
  appendMessage('new media session ID:' + mediaSession.mediaSessionId +
      ' (' + how + ')');
  currentMediaSession = mediaSession;
  currentMediaSession.addUpdateListener(onMediaStatusUpdate);
  mediaCurrentTime = currentMediaSession.currentTime;
  playpauseresume.innerHTML = 'Play';
  document.getElementById('casticon').src = CAST_ICON_THUMB_ACTIVE;
  document.getElementById('playerstate').innerHTML =
      currentMediaSession.playerState;
  if (!timer) {
    timer = setInterval(updateCurrentTime.bind(this),
        PROGRESS_BAR_UPDATE_DELAY);
    playpauseresume.innerHTML = 'Pause';
  }
}

/**
 * callback on media loading error
 * @param {Object} e A non-null media object
 */
function onMediaError(e) {
  console.log('media error');
  appendMessage('media error');
  document.getElementById('casticon').src = CAST_ICON_THUMB_WARNING;
}

/**
 * get media status initiated by sender when necessary
 * currentMediaSession gets updated
 * @this getMediaStatus
 */
function getMediaStatus() {
  if (!session || !currentMediaSession) {
    return;
  }

  currentMediaSession.getStatus(null,
      mediaCommandSuccessCallback.bind(this, 'got media status'),
      onError);
}

/**
 * callback for media status event
 * @param {boolean} isAlive status from callback
 */
function onMediaStatusUpdate(isAlive) {
  if (!isAlive) {
    currentMediaTime = 0;
  }
  else {
    if (currentMediaSession.playerState == 'PLAYING') {
      if (progressFlag) {
        document.getElementById('progress').value = parseInt(100 *
            currentMediaSession.currentTime /
            currentMediaSession.media.duration);
        document.getElementById('progress_tick').innerHTML =
            currentMediaSession.currentTime;
        document.getElementById('duration').innerHTML =
            currentMediaSession.media.duration;
        progressFlag = 0;
      }
      document.getElementById('playpauseresume').innerHTML = 'Pause';
    }
  }
  document.getElementById('playerstate').innerHTML =
      currentMediaSession.playerState;
}

/**
 * Updates the progress bar shown for each media item.
 */
function updateCurrentTime() {
  if (!session || !currentMediaSession) {
    return;
  }

  if (currentMediaSession.media && currentMediaSession.media.duration != null) {
    var cTime = currentMediaSession.getEstimatedTime();
    document.getElementById('progress').value = parseInt(100 * cTime /
        currentMediaSession.media.duration);
    document.getElementById('progress_tick').innerHTML = cTime;
  }
  else {
    document.getElementById('progress').value = 0;
    document.getElementById('progress_tick').innerHTML = 0;
    if (timer) {
      clearInterval(timer);
    }
  }
}

/**
 * play media
 * @this playMedia
 */
function playMedia() {
  if (!currentMediaSession) {
    return;
  }

  if (timer) {
    clearInterval(timer);
  }

  var playpauseresume = document.getElementById('playpauseresume');
  if (playpauseresume.innerHTML == 'Play') {
    currentMediaSession.play(null,
      mediaCommandSuccessCallback.bind(this, 'playing started for ' +
          currentMediaSession.sessionId),
      onError);
      playpauseresume.innerHTML = 'Pause';
      appendMessage('play started');
      timer = setInterval(updateCurrentTime.bind(this),
          PROGRESS_BAR_UPDATE_DELAY);
  }
  else {
    if (playpauseresume.innerHTML == 'Pause') {
      currentMediaSession.pause(null,
        mediaCommandSuccessCallback.bind(this, 'paused ' +
            currentMediaSession.sessionId),
        onError);
      playpauseresume.innerHTML = 'Resume';
      appendMessage('paused');
    }
    else {
      if (playpauseresume.innerHTML == 'Resume') {
        currentMediaSession.play(null,
          mediaCommandSuccessCallback.bind(this, 'resumed ' +
              currentMediaSession.sessionId),
          onError);
        playpauseresume.innerHTML = 'Pause';
        appendMessage('resumed');
        timer = setInterval(updateCurrentTime.bind(this),
            PROGRESS_BAR_UPDATE_DELAY);
      }
    }
  }
}

/**
 * stop media
 * @this stopMedia
 */
function stopMedia() {
  if (!currentMediaSession)
    return;

  currentMediaSession.stop(null,
    mediaCommandSuccessCallback.bind(this, 'stopped ' +
        currentMediaSession.sessionId),
    onError);
  var playpauseresume = document.getElementById('playpauseresume');
  playpauseresume.innerHTML = 'Play';
  appendMessage('media stopped');
  if (timer) {
    clearInterval(timer);
  }
}

/**
 * set media volume
 * @param {Number} level A number for volume level
 * @param {Boolean} mute A true/false for mute/unmute
 * @this setMediaVolume
 */
function setMediaVolume(level, mute) {
  if (!currentMediaSession)
    return;

  var volume = new chrome.cast.Volume();
  volume.level = level;
  currentVolume = volume.level;
  volume.muted = mute;
  var request = new chrome.cast.media.VolumeRequest();
  request.volume = volume;
  currentMediaSession.setVolume(request,
    mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
    onError);
}

/**
 * set receiver volume
 * @param {Number} level A number for volume level
 * @param {Boolean} mute A true/false for mute/unmute
 * @this setReceiverVolume
 */
function setReceiverVolume(level, mute) {
  if (!session)
    return;

  if (!mute) {
    session.setReceiverVolumeLevel(level,
      mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
      onError);
    currentVolume = level;
  }
  else {
    session.setReceiverMuted(true,
      mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
      onError);
  }
}

/**
 * mute media
 */
function muteMedia() {
  if (!session || !currentMediaSession) {
    return;
  }

  var muteunmute = document.getElementById('muteunmute');
  // It's recommended that setReceiverVolumeLevel be used
  // but media stream volume can be set instread as shown in the
  // setMediaVolume(currentVolume, true);
  if (muteunmute.innerHTML == 'Mute media') {
    muteunmute.innerHTML = 'Unmute media';
    setReceiverVolume(currentVolume, true);
    appendMessage('media muted');
  } else {
    muteunmute.innerHTML = 'Mute media';
    setReceiverVolume(currentVolume, false);
    appendMessage('media unmuted');
  }
}

/**
 * seek media position
 * @param {Number} pos A number to indicate percent
 * @this seekMedia
 */
function seekMedia(pos) {
  console.log('Seeking ' + currentMediaSession.sessionId + ':' +
    currentMediaSession.mediaSessionId + ' to ' + pos + '%');
  progressFlag = 0;
  var request = new chrome.cast.media.SeekRequest();
  request.currentTime = pos * currentMediaSession.media.duration / 100;
  currentMediaSession.seek(request,
    onSeekSuccess.bind(this, 'media seek done'),
    onError);
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 */
function onSeekSuccess(info) {
  console.log(info);
  appendMessage(info);
  setTimeout(function() {progressFlag = 1},PROGRESS_BAR_UPDATE_DELAY);
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 */
function mediaCommandSuccessCallback(info) {
  console.log(info);
  appendMessage(info);
}

function question(){
    var question = {
        question: {
            question: "Hva heter artisten?",
            type: "youtube",
            id: "3vC5TsSyNjU"
        }
    };
    sendMessage('Sending question');
    sendMessage(question);

    session.launchApp

    console.log("Question: " , question);
}