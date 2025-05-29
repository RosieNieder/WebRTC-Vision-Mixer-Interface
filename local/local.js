//---------------------LOCAL NODE-----------------
import { StreamManager } from '../Modules/StreamManager.js';
import { DeviceManager } from '../Modules/DeviceManager.js';
import { SignallingManager } from '../Modules/SignallingManager.js';


let operator = "vision-mixer";
let webSocketAddress = "ws://192.168.0.102:3200"
const peerConn = new RTCPeerConnection;

//create managers
const streamManager = new StreamManager();
const deviceManager = new DeviceManager();
const signallingManager = new SignallingManager(peerConn, webSocketAddress, operator);

//initialise constraints
let pgmStreamConstraints, commsStreamConstraints;

//----------------get HTML UI elements-------------
//menus
const multiviewerMenu = document.getElementById("multiviewer-input-select");
const programmeAudioInputMenu = document.getElementById("programme-audio-input-select");
const commsAudioInputMenu = document.getElementById("comms-audio-input-select");


//buttons
const sendUserButton = document.getElementById("send-user-button");
const confirmInputDevicesButton = document.getElementById('confirm-input-devices-button');
const startCallButton = document.getElementById('start-call-button');
const inspectButton = document.getElementById('inspect-button');

//monitors
const multiviewVideoMon = document.getElementById("multiview-video-monitor");
const pgmAudioMonitor = document.getElementById("pgm-audio-monitor");
const localCommsMonitor = document.getElementById("local-comms-audio-monitor");


// --------------- function definitions ------------
async function init() {
    await deviceManager.init()
    pgmStreamConstraints = deviceManager.getStreamConstraints('programme');
    commsStreamConstraints = deviceManager.getStreamConstraints('comms');
}

function initialiseCall() {
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
}

//-----------------start programme------------
await init();

//add menus to device manager if permissions granted

if (deviceManager.devicePermissions) {
deviceManager.addMenu(multiviewerMenu, 'videoinput', 'programme')
deviceManager.addMenu(programmeAudioInputMenu, 'audioinput', 'programme')
deviceManager.addMenu(commsAudioInputMenu, 'audioinput', 'comms')
}


// event listeners
sendUserButton.onclick = () => {
    signallingManager.sendUser(); //NOTE TO SELF, does this need to be asynchronous, as server may take a while to respond? also still sending user:undefined before actual user
}

confirmInputDevicesButton.onclick = () => {
    initialiseCall();
}

inspectButton.onclick = () => {
    inspection();
}

startCallButton.onclick = () => {
    signallingManager.createAndSendOffer();
}