
import { SignallingManager } from '../Modules/SignallingManager.js';

const peerConn = new RTCPeerConnection;

let operator = "vision-mixer";
let webSocketAddress = "ws://192.168.0.101:3200"

const signallingManager = new SignallingManager(peerConn, webSocketAddress, operator, "receiver");
let testStream;


async function init() {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video:true}).then((stream) => {
        testStream = stream;
        peerConn.addStream(testStream);
    });   
}




const myButton = document.getElementById("myButton");
const myVideo = document.getElementById("remote-stream");

const inspectButton = document.getElementById("peerConnInspect");
init();

myButton.onclick = () => {
    
    signallingManager.joinCall()
    signallingManager.createAndSendAnswer();
    
    console.log("remote description: ", peerConn.remoteDescription, "local description: ", peerConn.localDescription);
};


inspectButton.onclick = () => {
    myVideo.srcObj = signallingManager.remoteStream;
    console.log(myVideo.srcObj);
    signallingManager.inspect();
 }
