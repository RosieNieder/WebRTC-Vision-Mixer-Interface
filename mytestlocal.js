import { SignallingManager } from '../Modules/SignallingManager.js';

const peerConn = new RTCPeerConnection;

let operator = "vision-mixer";
let webSocketAddress = "ws://192.168.0.102:3200"
const myButton = document.getElementById("myButton");
const answerButton = document.getElementById("receiveAnswer");
const inspectButton = document.getElementById("peerConnInspect");
const myVideo = document.getElementById("remote-stream");


const signallingManager = new SignallingManager(peerConn, webSocketAddress, operator, "caller");
const stream = await navigator.mediaDevices.getUserMedia({audio: true, video:true});
console.log(stream);

peerConn.addStream(stream);



// both ends connect to signalling server and identify with store_user
// add tracks and create and send offer to server

// join call from remote
// server sends offer and ICE candidatraes back to remote
// remote processes offer, adds media tracks  and sends answer back to caller

//local processes answer and sets remote description to answer

inspectButton.onclick = () => {
   signallingManager.inspect();
}





myButton.onclick = () => {
    signallingManager.sendUser();
    signallingManager.createAndSendOffer();
};
answerButton.onclick = () => {
    myVideo.srcObj = stream;
};


