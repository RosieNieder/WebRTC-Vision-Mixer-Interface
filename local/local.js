//---------------------LOCAL NODE-----------------
import { StreamManager } from '../Modules/StreamManager.js';
import { DeviceManager } from '../Modules/DeviceManager.js';
import { SignallingManager } from '../Modules/SignallingManager.js';


let operator = "vision-mixer";
let webSocketAddress = null;
const peerConn = new RTCPeerConnection;

//create managers
const streamManager = new StreamManager();
const deviceManager = new DeviceManager();
let signallingManager = null;


//initialise constraints
let pgmStreamConstraints, commsStreamConstraints;

//----------------get HTML UI elements-------------
//menus
const multiviewerMenu = document.getElementById("multiviewer-input-select");
const programmeAudioInputMenu = document.getElementById("programme-audio-input-select");
const commsAudioInputMenu = document.getElementById("comms-audio-input-select");
const audioOutputMenu = document.getElementById("audio-output-select");

//buttons
const startCallButton = document.getElementById('start-call-button');
startCallButton.disabled = true;
const inspectButton = document.getElementById('inspect-button');
const updateMonitorButton = document.getElementById('update-monitors-button');
const hangUpCallButton = document.getElementById('hang-up-call-button');


//monitors
const multiviewVideoMon = document.getElementById("multiview-video-monitor");
const pgmAudioMonitor = document.getElementById("pgm-audio-monitor");
const localCommsMonitor = document.getElementById("local-comms-audio-monitor");
const remoteCommsMonitor = document.getElementById("remote-comms-audio-monitor");

// --------------- function definitions ------------
async function init() {
    await deviceManager.init()
    pgmStreamConstraints = deviceManager.getStreamConstraints('programme');
    commsStreamConstraints = deviceManager.getStreamConstraints('comms');
}

function initialiseStreams() {
    pgmStreamConstraints = deviceManager.getStreamConstraints('programme');
    commsStreamConstraints = deviceManager.getStreamConstraints('comms');
    streamManager.createStream('programme', pgmStreamConstraints)
    .then(() => {
        streamManager.routeStreamToElement('programme', pgmAudioMonitor);
        streamManager.routeStreamToElement('programme', multiviewVideoMon)
    }).catch (err => {
        console.error("Failed to create and attach stream to monitors: ", err);
    })
    streamManager.createStream('comms', commsStreamConstraints)
    .then(() => {
        streamManager.routeStreamToElement('comms', localCommsMonitor);
    })
    .then(() =>{
        streamManager.attachStreamToPeerConnection('programme', peerConn);
        streamManager.attachStreamToPeerConnection('comms', peerConn);
    }).catch (err => {
        console.error("Failed to create and attach stream to monitors: ", err);
    })
}

function inspection(){
    console.warn("STARTING INSPECTION");
    // console.log("peer connection senders: ", peerConn.getSenders());
    console.log("programme constraints: ", pgmStreamConstraints);
    console.log("comms constraints: ", commsStreamConstraints);
    console.log("programme stream: ", streamManager.streams['programme']);
    console.log("comms stream: ", streamManager.streams['comms']);
    peerConn.getStats().then((stats) =>
    {
        stats.forEach(element => {
            console.log(element);
            
        });
    });
}

function updateMonitor() {
    Object.entries(signallingManager.incomingStreams).forEach(([streamId, tracks]) => {
        const stream = new MediaStream(tracks);
        if (tracks.length === 1) {
            remoteCommsMonitor.srcObject = stream;
        }
    })
} 

//-----------------start programme------------
await init();

//add menus to device manager if permissions granted

if (deviceManager.devicePermissions) {
    deviceManager.addMenu(multiviewerMenu, 'videoinput', 'programme')
    deviceManager.addMenu(programmeAudioInputMenu, 'audioinput', 'programme')
    deviceManager.addMenu(commsAudioInputMenu, 'audioinput', 'comms')
    deviceManager.addMenu(audioOutputMenu, 'audiooutput');
}

initialiseStreams();

audioOutputMenu.onchange = () => {
    deviceManager.setAudioOutput(audioOutputMenu, pgmAudioMonitor);
}

multiviewerMenu.onchange = () => {
    pgmStreamConstraints = deviceManager.getStreamConstraints('programme');
    streamManager.createStream('programme', pgmStreamConstraints)
    .then(() => {
        streamManager.routeStreamToElement('programme', pgmAudioMonitor);
        streamManager.routeStreamToElement('programme', multiviewVideoMon)
    }).then(() => {
        streamManager.attachStreamToPeerConnection('programme', peerConn);
    }).catch((err) => {
        console.log("error updating and attaching stream: ", err);
    })
}

//BUG! Changing this pauses video on remote end?
programmeAudioInputMenu.onchange = () => {
    pgmStreamConstraints = deviceManager.getStreamConstraints('programme');
    streamManager.createStream('programme', pgmStreamConstraints)
    .then(() => {
        streamManager.routeStreamToElement('programme', pgmAudioMonitor);
        streamManager.routeStreamToElement('programme', multiviewVideoMon)
    }).then(() => {
        streamManager.attachStreamToPeerConnection('programme', peerConn);
    }).catch((err) => {
        console.log("error updating and attaching stream: ", err);
    })
        
}

commsAudioInputMenu.onchange = () => {
    commsStreamConstraints = deviceManager.getStreamConstraints('comms');
    streamManager.createStream('comms', commsStreamConstraints)
    .then(() => {
        streamManager.routeStreamToElement('comms', localCommsMonitor)
    }).then(() => {
        streamManager.attachStreamToPeerConnection('comms', peerConn);
    }).catch((err) => {
        console.log("error updating and attaching stream: ", err);
    })
}

hangUpCallButton.onclick = () => {
    console.log("hanging up call");
    signallingManager.hangUp();

}
updateMonitorButton.onclick = () => {
    console.log("Updating monitor")
    updateMonitor();
}

inspectButton.onclick = () => {
    inspection();
    console.log(deviceManager.getCurrentDeviceSelection());

}

startCallButton.onclick = () => {
if (!signallingManager.peerConn){
    signallingManager.peerConn = new RTCPeerConnection;
}
    signallingManager.sendUser();
    signallingManager.createAndSendOffer();
}

document.getElementById('connect-button').addEventListener('click', () => {
  const socketUrl = document.getElementById('websocket-url').value.trim();
  if (signallingManager != null){
    console.log("socket open, closing socket")
    signallingManager.webSocket.close();
  }

  if (!socketUrl.startsWith('ws://') && !socketUrl.startsWith('wss://')) {
    alert('Please enter a valid WebSocket address (ws:// or wss://)');
    return;
  } else {
    signallingManager = new SignallingManager(peerConn, socketUrl, operator, 'caller')
  }
  
  if (signallingManager != null && signallingManager.webSocket) {
    signallingManager.webSocket.addEventListener("open", () => {
        startCallButton.disabled = false;
    })
    
    signallingManager.webSocket.addEventListener("error", () => {
        startCallButton.disabled = true;
        })
    }
    signallingManager.webSocket.addEventListener("close", () => {
        startCallButton.disabled = true;
    })
});

