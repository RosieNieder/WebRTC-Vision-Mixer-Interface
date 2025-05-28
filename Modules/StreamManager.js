// takes in a peer connection and a list of streams and their configurations (i.e. audio and video reqs)
// 



export class StreamManager {
    constructor() {
        this.streams = {};
    }

    async createStream(streamId, constraints) {
        if (this.streams[streamId]) {
            console.log("stream exists, stopping stream")
            this.stopStream(streamId);
        }
        try {
            console.log("creating stream: " +streamId)
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.streams[streamId] = stream;
            return stream;
        } catch (err) {
            console.error("Failed to create ${streamId}", err);
            return null;
        }
    }

    stopStream(streamId) {
        console.log(this.streams);
        const stream = this.streams[streamId];
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            delete this.streams[streamId];
        }
    }

    getStream(streamId) {
        return this.streams[streamId] || null;
    }

    addStreamToPeerConnection(streamId, peerConn) {
        const stream = this.getStream(streamId);
        if (stream) {
            stream.getTracks().forEach(track => {
                peerConn.addTrack(track, stream);
                
            });
            console.log(peerConn);
        }
    }

    routeStreamToElement(streamId, element) {
        if (this.streams[streamId]) {
            element.srcObject = this.streams[streamId];
            console.log("Routing ", streamId, " to ", element)
        }
    }

    
}
