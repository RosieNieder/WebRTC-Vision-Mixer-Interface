/* Programme Elements
Get permission to use audio and video IPs and OPs
Maintain list of currently connected devices
Use user selection of devices to determine the configuration of the stream -> if user changes the device, update the stream

Monitor outgoing progamme video and audio levels, as well as outgoing comms level

Output incoming comms audio via separate interface - i.e. interface to be used by OB to integrate into comms architecture

*/

//import modules
import { DeviceManager } from '../Modules/DeviceManager.js';
import {AudioMixer} from '../Modules/AudioMixer.js';
import { MediaManager } from  '../Modules/MediaManager.js';

// <---------------------------------- Initialisation ----------------------------------->

const deviceManager = new DeviceManager(
	{videoInputSelect: document.getElementById("pgm-video-selection"),
	audioInputSelect: document.getElementById("pgm-audio-selection"),
	commsInputSelect: document.getElementById("comms-input-selection"),
	commsAudioOutputSelect: document.getElementById("comms-output-selection"),
	monitorAudioOutputSelect: document.getElementById("monitor-output-selection")});



let peerConn = new RTCPeerConnection();
let monitorMix;

//audio and video monitoring elements
const localVideoPlayer = document.getElementById("local-video");
const pgmAudioPlayer = document.getElementById("pgm-audio-monitor");
const commsAudioPlayer = document.getElementById("comms-audio-monitor");
const remoteCommsPlayer = document.getElementById("remote-comms");

const mediaManager = new MediaManager(peerConn, localVideoPlayer, pgmAudioPlayer, commsAudioPlayer, remoteCommsPlayer);

//function declarations
async function init() {
	deviceManager.init();
	mediaManager.init();
	const monitorMix = new AudioMixer('default');
}

//event listeners
navigator.mediaDevices.ondevicechange = (event) => {
	console.log("Device change detected");
	deviceManager.populateDeviceMenus();
};

deviceManager.videoInputSelect.onchange = () => {
console.log("Video input changed");
handleDeviceChange();
}
deviceManager.audioInputSelect.onchange = () => {
console.log("Audio input changed");
handleDeviceChange();
}
deviceManager.commsInputSelect.onchange = () => {
console.log("Comms input changed");
handleDeviceChange();
}
deviceManager.monitorAudioOutputSelect.onchange = () => {
console.log("Monitor output changed");
handleDeviceChange();
monitorMix.setOutputDevice(monitorAudioOutputSelect.value);
}
deviceManager.commsAudioOutputSelect.onchange = () => {
console.log("Comms output changed");
handleDeviceChange();
}



async function handleDeviceChange(){
	// console.log("Device change detected");
	mediaManager.updateConstraints(
		deviceManager.getPgmStreamConstraints(), 
		deviceManager.getCommsStreamConstraints());
	await mediaManager.getStreams();
	mediaManager.attachTracksToPeerConnection();
	// monitorMix.createMixer();

	console.log(peerConn);
	console.log(deviceManager.getPgmStreamConstraints());
}

function startCall() {
	mediaManager.attachTracksToPeerConnection();
}

//start programme

init();
