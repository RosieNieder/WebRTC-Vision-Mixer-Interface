/* TODO: Add Websocket address input field

*/
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
const signallingManager = new SignallingManager(peerConn, webSocketAddress, operator, "receiver");

//initialise constraints
let commsStreamConstraints;

//----------------get HTML UI elements-------------
//menus
const commsAudioInputMenu = document.getElementById("comms-audio-input-select");

//buttons
const joinCallButton = document.getElementById('join-call-button');
const inspectButton = document.getElementById('inspect-button');
const updateMonitorButton = document.getElementById('update-monitors-button')

//monitors
const multiviewVideoMon = document.getElementById("multiview-video-monitor");
const pgmAudioMonitor = document.getElementById("pgm-audio-monitor");
const localCommsMonitor = document.getElementById("local-comms-audio-monitor");

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
    }).catch (err => {
        console.error("Failed to create and attach stream to monitors: ", err);
    })
}

function inspection(){
    console.warn("STARTING INSPECTION");
    // console.log("peer connection senders: ", peerConn.getSenders());
    console.log("comms constraints: ", commsStreamConstraints);
    console.log("comms stream: ", streamManager.streams['comms']);
}

//-----------------start programme------------
await init();

//add menus to device manager if permissions granted

if (deviceManager.devicePermissions) {
    deviceManager.addMenu(commsAudioInputMenu, 'audioinput', 'comms')
    initialiseCall();
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

inspectButton.onclick = () => {
    inspection();
    console.log(deviceManager.getCurrentDeviceSelection());
}

joinCallButton.onclick = () => {
    signallingManager.joinCall();
    signallingManager.createAndSendAnswer();
}

function updateMonitor() {
    const stream = signallingManager.remoteStream;
    multiviewVideoMon.srcObject = stream;
    pgmAudioMonitor.srcObject = stream;
}

updateMonitorButton.onclick = () => {
    updateMonitor();
}
