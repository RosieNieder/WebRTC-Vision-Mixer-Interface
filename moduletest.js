import { DeviceManager } from '../Modules/DeviceManager.js';
import { MediaManager } from '../Modules/MediaManager.js';

//initialise managers
const deviceManager = new DeviceManager;
const mediaManager = new MediaManager;

//get html UI elements

const videoMenu = document.getElementById("multiview-video-input");
const audioMenu = document.getElementById("multiview-audio-input");
const commsMenu = document.getElementById("comms-audio-input");
const audioMonitorMenu = document.getElementById("monitor-audio-output");
const commsOutputMenu = document.getElementById("comms-audio-output");

//define streams

let pgmStream, commsStream, pgmStreamConstraints, commsStreamConstraints;

async function init() {
    await deviceManager.init();
}

await init();

//add menus to device manager
deviceManager.addMenu(videoMenu, 'videoinput', 'programme');
deviceManager.addMenu(audioMenu, 'audioinput', 'programme');
deviceManager.addMenu(commsMenu, 'audioinput', 'comms');
deviceManager.addMenu(audioMonitorMenu, 'audiooutput', 'monitor');
deviceManager.addMenu(commsOutputMenu, 'audiooutput', 'comms');

navigator.mediaDevices.ondevicechange = (event) => {
    deviceManager.handleAttachedDeviceChange();
}

const deviceSelectButton = document.getElementById("GetDeviceSelection");
const startStreamButton = document.getElementById("start-programme-stream");

//event listeners for user selection change
videoMenu.onchange = () => {
    pgmStreamConstraints = deviceManager.getSelectedDevices('programme')
    console.log("Video input changed");
    console.log(pgmStreamConstraints);
}
audioMenu.onchange = () => {
    pgmStreamConstraints = deviceManager.getSelectedDevices('programme')
    console.log("Audio input changed");
    console.log(pgmStreamConstraints);
}
commsMenu.onchange = () => {
    commsStreamConstraints = deviceManager.getSelectedDevices('comms')
    console.log("Comms audio input changed");
    console.log(commsStreamConstraints);
}
audioMonitorMenu.onchange = () => {
    const outputDevices = deviceManager.getSelectedDevices('monitor')
    console.log("Monitor audio output changed");
    console.log(outputDevices);
}
commsOutputMenu.onchange = () => {
    const commsOutputDevice = deviceManager.getSelectedDevices('comms')
    console.log("Comms audio output changed");
    console.log(commsOutputDevice);
}

//event listener for button
deviceSelectButton.onclick = () => {
    const pgmDevices = deviceManager.getSelectedDevices('programme');
    pgmStreamConstraints = mediaManager.getConstraints(pgmDevices);
    
    commsStreamConstraints = mediaManager.getConstraints(deviceManager.getSelectedDevices('comms'));
    console.log(pgmStreamConstraints);
    console.log(commsStreamConstraints);
    pgmStream = mediaManager.startStream(pgmStreamConstraints);
    commsStream = mediaManager.startStream(commsStreamConstraints);
    const videoMon = document.getElementById("multiview-video-input");
    videoMon.srcObj = pgmStream;


    const constraints = {
        audio: true,
        video: true,
    }
    console.log(constraints);
}


