// takes in a peer connection and a list of streams and their configurations (i.e. audio and video reqs)

export class StreamManager {
    constructor() {
        this.streams = {};
        this.streamSenders = {};
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



    //TODO: THIS DOESN'T WORK AT ALL!
    attachStreamToPeerConnection(streamId, peerConn){
        //check is stream is already attached
        let exists = false;
        peerConn.getSenders().forEach(sender => {
            
            if(this.getStreamIdFromSender(sender) === streamId) {
                console.log("Stream Exists");
                exists = true;
                 //execute code to update stream rather than start stream
            } else {
                exists = false;
            }
           
        })

        if (exists === false) {
            const currentSenders = this.streamSenders || [];
            //get stream
            const stream = this.getStream(streamId);
            //attach stream
            stream.getTracks().forEach(track => {
                const sender = peerConn.addTrack(track);
                sender._streamId = streamId; //tag stream with it's ID
                currentSenders[streamId] = peerConn.getSenders();
                console.log(currentSenders);
            })
        }
        else {
            peerConn.getSenders().forEach(sender =>{

            })
        }
    
    }
    

    routeStreamToElement(streamId, element) {
        if (this.streams[streamId]) {
            element.srcObject = this.streams[streamId];
            console.log("Routing ", streamId, " to ", element)
        }
    }


    getStreamIdFromSender(sender) {
        return sender._streamId || null;
    }
    }
