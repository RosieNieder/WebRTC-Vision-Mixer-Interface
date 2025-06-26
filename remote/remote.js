/* TODO: Add Websocket address input field

*/
//---------------------LOCAL NODE-----------------
import { StreamManager } from '../Modules/StreamManager.js';
import { DeviceManager } from '../Modules/DeviceManager.js';
import { SignallingManager } from '../Modules/SignallingManager.js';


let operator = "vision-mixer";
let webSocketAddress;
let peerConn = new RTCPeerConnection;

//create managers
const streamManager = new StreamManager();
const deviceManager = new DeviceManager();
let signallingManager;

//initialise constraints
let commsStreamConstraints;

//----------------get HTML UI elements-------------
//menus
const commsAudioInputMenu = document.getElementById("comms-audio-input-select");
const audioOutputMenu = document.getElementById("comms-audio-output-select");

//buttons
const joinCallButton = document.getElementById('join-call-button');
joinCallButton.disabled = true;
const inspectButton = document.getElementById('inspect-button');
const updateMonitorButton = document.getElementById('update-monitors-button')
const connectButton = document.getElementById('connect-button');
const hangUpCallButton = document.getElementById('hang-up-call-button');

//monitors
const multiviewVideoMon = document.getElementById("multiview-video-monitor");
const pgmAudioMonitor = document.getElementById("pgm-audio-monitor");
const localCommsMonitor = document.getElementById("local-comms-audio-monitor");
const remoteCommsMonitor = document.getElementById("remote-comms-audio-monitor");

// --------------- function definitions ------------
async function init() {
    await deviceManager.init()
    commsStreamConstraints = deviceManager.getStreamConstraints('comms');
}

function initialiseCall() {
    commsStreamConstraints = deviceManager.getStreamConstraints('comms');
    streamManager.createStream('comms', commsStreamConstraints)
    .then(() => {
        streamManager.routeStreamToElement('comms', localCommsMonitor);
    }).then(() => {
        streamManager.attachStreamToPeerConnection('comms', peerConn)
    }).catch (err => {
        console.error("Failed to create and attach stream to monitors: ", err);
    })
}

function inspection(){
    console.warn("STARTING INSPECTION");
    // console.log("peer connection senders: ", peerConn.getSenders());
    console.log("comms constraints: ", commsStreamConstraints);
    console.log("comms stream: ", streamManager.streams['comms']);
    console.log(signallingManager.peerConn);
    console.log(peerConn);
}

//-----------------start programme------------
await init();

//add menus to device manager if permissions granted

if (deviceManager.devicePermissions) {
    deviceManager.addMenu(commsAudioInputMenu, 'audioinput', 'comms')
    deviceManager.addMenu(audioOutputMenu, 'audiooutput')
    initialiseCall();
}

commsAudioInputMenu.onchange = () => {
    commsStreamConstraints = deviceManager.getStreamConstraints('comms');
    streamManager.createStream('comms', commsStreamConstraints)
    .then(() => {
        streamManager.routeStreamToElement('comms', localCommsMonitor)
    }).then(() => {
        streamManager.attachStreamToPeerConnection('comms', peerConn)
    }).catch((err) => {
        console.log("error updating and attaching stream: ", err);
    })
}

inspectButton.onclick = () => {
    inspection();
    console.log(deviceManager.getCurrentDeviceSelection());
    console.log(signallingManager.peerConn.getReceivers());
    console.log(multiviewVideoMon.srcObject);
}

joinCallButton.onclick = () => {
    peerConn = new RTCPeerConnection;
    signallingManager.joinCall();
    signallingManager.createAndSendAnswer();
}

function updateMonitor() {
    console.log(signallingManager.incomingStreams);

    Object.entries(signallingManager.incomingStreams).forEach(([streamId, tracks]) => {
        const stream = new MediaStream(tracks);

        if (tracks.length === 2) {
            console.log(stream.getVideoTracks());
                multiviewVideoMon.srcObject = stream;
            pgmAudioMonitor.srcObject = stream;
        } else if (tracks.length === 1) {
            remoteCommsMonitor.srcObject = stream;
        }
    })
    
}

audioOutputMenu.onchange = () => {
    deviceManager.setAudioOutput(audioOutputMenu, pgmAudioMonitor);
}

updateMonitorButton.onclick = () => {
    updateMonitor();
}

multiviewVideoMon.addEventListener('dblclick', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    multiviewVideoMon.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable full-screen mode: ${err.message}`);
    });
  }
});


connectButton.addEventListener('click', () => {
  const socketUrl = document.getElementById('websocket-url').value.trim();
  if (signallingManager != null){
    console.log("socket open, closing socket")
    signallingManager.webSocket.close();
  }

  if (!socketUrl.startsWith('ws://') && !socketUrl.startsWith('wss://')) {
    alert('Please enter a valid WebSocket address (ws:// or wss://)');
    return;
  } else {
    signallingManager = new SignallingManager(peerConn, socketUrl, operator, 'receiver')
  }
  
  if (signallingManager != null && signallingManager.webSocket) {
    signallingManager.webSocket.addEventListener("open", () => {
        joinCallButton.disabled = false;
        signallingManager.updateStatus('connected');
    })
    
    signallingManager.webSocket.addEventListener("error", () => {
        joinCallButton.disabled = true;
        signallingManager.updateStatus('error');
        })
    }
    signallingManager.webSocket.addEventListener("close", () => {
        joinCallButton.disabled = true;
        signallingManager.updateStatus('disconnected');
    })
});



hangUpCallButton.onclick = () => {
    signallingManager.hangUp();
    console.log("Hanging Up")
}