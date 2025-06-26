/* check browser supports WebRTC

if (!navigator.mediaDevices || !window.RTCPeerConnection) {
  alert("Your browser doesn't support WebRTC.");
}

Programme flow:
1. Ask for user input (server address)

2. Connect to WebSocket

3. Get device permissions

4. Populate menus

5. Start stream

6. Send offer
*/

import { StreamManager } from '../Modules/StreamManager.js';
import { DeviceManager } from '../Modules/DeviceManager.js';
import { SignallingManager } from '../Modules/SignallingManager.js';

// const webSocket = new WebSocket("ws://localhost:3200");
let operator = "vision-mixer";
//get html UI elements
const videoMenu = document.getElementById("multiview-video-input");
const audioMenu = document.getElementById("multiview-audio-input");
const commsMenu = document.getElementById("comms-audio-input");
const audioMonitorMenu = document.getElementById("monitor-audio-output");
const commsOutputMenu = document.getElementById("comms-audio-output");

const videoMon = document.getElementById("videoMon");
const audioMon = document.getElementById("audioMon");
const localCommsAudioMon = document.getElementById("localCommsAudioMon");
const remoteCommsAudioMon = document.getElementById("remoteCommsAudioMon");

//initialise managers
const peerConn = new RTCPeerConnection();

const deviceManager = new DeviceManager;
const streamManager = new StreamManager;
const signallingManager = new SignallingManager(peerConn, 'ws://192.168.0.102:3200', operator);

//define streams
let pgmStream, commsStream;
let pgmStreamConstraints, commsStreamConstraints;

videoMon.srcObj = pgmStream;
audioMon.srcObj = pgmStream;
localCommsAudioMon.srcObj = commsStream;


async function init() {
    await deviceManager.init();
    pgmStreamConstraints = deviceManager.getStreamConstraints('programme');
    commsStreamConstraints = deviceManager.getStreamConstraints('comms');
}

await init();

//add menus to device manager
deviceManager.addMenu(videoMenu, 'videoinput', 'programme');
deviceManager.addMenu(audioMenu, 'audioinput', 'programme');
deviceManager.addMenu(commsMenu, 'audioinput', 'comms');
deviceManager.addMenu(audioMonitorMenu, 'audiooutput');
deviceManager.addMenu(commsOutputMenu, 'audiooutput');

navigator.mediaDevices.ondevicechange = (event) => {
    deviceManager.handleAttachedDeviceChange();
}

const pgmDeviceSelectButton = document.getElementById("GetPgmDeviceSelection");
const commsDeviceSelectButton = document.getElementById("GetCommsSelection");
const startPgmStreamButton = document.getElementById("start-programme-stream");
const startCommsStreamButton = document.getElementById("start-comms-stream")
const sendUserButton = document.getElementById('initialise-user');
const inpectButton = document.getElementById("Inspect");


//event listeners for user selection change
videoMenu.onchange = () => {
    // pgmStreamConstraints = deviceManager.getSelectedDevices('programme')
    console.log("Video input changed");
    console.log(pgmStreamConstraints);
}
audioMenu.onchange = () => {
    // pgmStreamConstraints = deviceManager.getSelectedDevices('programme')
    console.log("Audio input changed");
    console.log(pgmStreamConstraints);
}
commsMenu.onchange = () => {
    // commsStreamConstraints = deviceManager.getSelectedDevices('comms')
    console.log("Comms audio input changed");
    console.log(commsStreamConstraints);
}
audioMonitorMenu.onchange = () => {
    // const outputDevices = deviceManager.getSelectedDevices('monitor')
    console.log("Monitor audio output changed");
    console.log(outputDevices);
}
commsOutputMenu.onchange = () => {
    // const commsOutputDevice = deviceManager.getSelectedDevices('comms')
    console.log("Comms audio output changed");
    console.log(commsOutputDevice);
}

//event listeners for buttons
pgmDeviceSelectButton.onclick = () => {
    pgmStreamConstraints = deviceManager.getStreamConstraints('programme');
    // console.log("Programme stream constraints: ", pgmStreamConstraints);

    streamManager.createStream('programme', pgmStreamConstraints)
    .then(() => {
        streamManager.routeStreamToElement('programme', videoMon);
        streamManager.routeStreamToElement('programme', audioMon);
    }).catch (err => {
        console.error("Failed to create and attach stream to monitors: ", err);
    })
}

commsDeviceSelectButton.onclick = () => {
    commsStreamConstraints = deviceManager.getStreamConstraints('comms');
    // console.log("Comms stream constraints: ", commsStreamConstraints);
    streamManager.createStream('comms', commsStreamConstraints)
    .then(() => {
        streamManager.routeStreamToElement('comms', localCommsAudioMon);
    }).catch (err => {
        console.error("Failed to create and attach stream to monitors: ", err);
    })
}

sendUserButton.onclick = () => {
    console.log("Sending user to server");
    signallingManager.sendUser();
}

startPgmStreamButton.onclick = () => {
    console.log(peerConn);
    console.log("Stream Button Clicked");  
    streamManager.attachStreamToPeerConnection('programme', peerConn);
    console.log(peerConn.getSenders());
    signallingManager.createAndSendOffer();
};
startCommsStreamButton.onclick = () => {
    // console.log(peerConn);
    console.log("Comms stream Button Clicked");  
    streamManager.attachStreamToPeerConnection('comms', peerConn);
    console.log(peerConn.getSenders());
    // signallingManager.createAndSendOffer();
};

signallingManager.handleIceCandidates();


inpectButton.onclick = () => {
    inspection();
}
function inspection(){
    console.warn("STARTING INSPECTION");
    console.log("peer connection senders: ", peerConn.getSenders());
    console.log("programme constraints: ", pgmStreamConstraints);
    console.log("comms constraints: ", commsStreamConstraints);
    console.log("programme stream: ", streamManager.streams['programme']);
    console.log("comms stream: ", streamManager.streams['comms']);
}