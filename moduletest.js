import { MediaManager } from '../Modules/MediaManager.js';
import { DeviceManager } from '../Modules/DeviceManager.js';
import { SignallingManager } from '../Modules/SignallingManager.js';


// const webSocket = new WebSocket("ws://localhost:3200");

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
// const mediaManager = new MediaManager(peerConn);
const signallingManager = new SignallingManager(peerConn, 'ws://192.168.0.102:3200');

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
const startStreamButton = document.getElementById("start-programme-stream");
const sendUserButton = document.getElementById('initialise-user');


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
    console.log("Programme stream constraints: ", pgmStreamConstraints);

   
    navigator.mediaDevices.getUserMedia(pgmStreamConstraints)
        .then(stream => {
            pgmStream = stream;
            videoMon.srcObject = pgmStream; 
            audioMon.srcObject = pgmStream;
            console.log("Programme stream started");
        })
        .catch(err => {
            console.error("Error starting programme stream: ", err);
        });
}

commsDeviceSelectButton.onclick = () => {
    commsStreamConstraints = deviceManager.getStreamConstraints('comms');
    console.log("Comms stream constraints: ", commsStreamConstraints);
    
    navigator.mediaDevices.getUserMedia(commsStreamConstraints)
        .then(stream => {
            commsStream = stream;
            localCommsAudioMon.srcObject = commsStream;
            console.log("Comms stream started");
        })
        .catch(err => {
            console.error("Error starting comms stream: ", err);
        });
}

sendUserButton.onclick = () => {
    console.log("Sending user to server");
    signallingManager.sendUser();
}

startStreamButton.onclick = () => {
    console.log("Starting programme stream");
    
    pgmStream.getTracks().forEach(track => {
        peerConn.addTrack(track, pgmStream);
    });
    console.log("Peer connection: ", peerConn.getSenders());

    if (commsStream != undefined) {
        commsStream.getTracks().forEach(track => track.stop());
    }
    commsStream.getTracks().forEach(track => { 
        peerConn.addTrack(track, commsStream);
    }
    );
    console.log("Comms stream added to peer connection");
    console.log("Peer connection: ", peerConn.getSenders());

    signallingManager.createAndSendOffer();
};

signallingManager.handleIceCandidates();

