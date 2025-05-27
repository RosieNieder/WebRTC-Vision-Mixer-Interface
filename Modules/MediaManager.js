// takes in a peer connection and a list of streams and their configurations (i.e. audio and video reqs)
// 



export class MediaManager {
    constructor(peerConnection
    ) {
        this.streams = []; //streamName: stream, constraints: constraints
        this.peerConnection = peerConnection;
        
    }
}
