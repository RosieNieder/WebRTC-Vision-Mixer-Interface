export class MediaManager {
    constructor(peerConnection) {
        this.streams = []; //streamName: stream, constraints: constraints
        this.peerConnection = peerConnection;
    }

    defineStream(stream, streamType, streamConstraints) {
        this.streams.push({
            stream: stream,
            streamType: streamType,
            streamConstraints: streamConstraints
        });
    }

    async startStream(constraints) {
        console.log(constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        return stream;
    }


    //is this in the same format as constraints - no it is not
    getConstraints(selectedDevices) {
        const constraints = [];
        let audioinput = false;
        let videoinput = false;
        selectedDevices.forEach(device => {
            console.log(device.deviceKind);
            if (device.deviceKind === 'audioinput') {
                audioinput = true;
                constraints.push({audio: {deviceId: device.deviceId ? {exact: device.deviceId} : undefined}})
            }
            if (device.deviceKind === 'videoinput') {
                videoinput = true;
            constraints.push({video: {deviceId: device.deviceId ? {exact: device.deviceId} : undefined}})
    }})
    if (!videoinput) {
        constraints.push({video: false});
    } else if (!audioinput) {
        constraints.push({audio: false});
    }
            
    return constraints;
        
    }
}



// export class MediaManager {
//     constructor(peerConn, videoMonitorElement, audioMonitorElement, commsAudioMonitorElement, remoteCommsAudioMonitorElement) {
//         this.peerConn = peerConn;
//         this.pgmStream = null;
//         this.commsStream = null;
//         this.pgmConstraints = {audio: true, video: true};
//         this.commsConstraints = {audio: true};
//         this.videoMonitor = videoMonitorElement;
//         this.audioMonitor = audioMonitorElement;
//         this.commsAudioMonitor = commsAudioMonitorElement;
//         this.remoteCommsAudioMonitor = remoteCommsAudioMonitorElement;
//     }

//     init() {
//         this.getStreams();
//     }

//     updateConstraints(pgmConstraints, commsConstraints) {
//         this.pgmConstraints = pgmConstraints;
//         this.commsConstraints = commsConstraints;
//         console.log(this.pgmConstraints, this.commsConstraints);
//     }

//     async getStreams() {
//         this.pgmStream = await navigator.mediaDevices.getUserMedia(this.pgmConstraints);
//         this.commsStream = await navigator.mediaDevices.getUserMedia(this.commsConstraints);
//         this.videoMonitor.srcObject = this.pgmStream;
//         this.audioMonitor.srcObject = this.pgmStream;
//         this.commsAudioMonitor.srcObject = this.commsStream;
//         console.log(this.pgmStream, this.commsStream);
//     }

//     attachTracksToPeerConnection() {
//         if (this.peerConn.getSenders().length > 0) {	
//             console.log("Peer connection already has senders");
//             this.peerConn.getSenders().forEach(sender => {
//                 if (sender.track.kind === 'video') {
//                     this.peerConn.removeTrack(sender);
//                 }
//                 else if (sender.track.kind === 'audio') {
//                     this.peerConn.removeTrack(sender);
//                 }
//             });
//         }
//         for (const track of this.pgmStream.getTracks()) {
//             this.peerConn.addTrack(track, this.pgmStream);
//         }
//         for (const track of this.commsStream.getTracks()) {
//             this.peerConn.addTrack(track, this.commsStream);
//         }
//         console.log(peerConn.getSenders());
//     }
// }