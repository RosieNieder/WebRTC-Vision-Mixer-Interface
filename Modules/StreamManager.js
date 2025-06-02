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
            stream.getTracks().forEach(track => { //tag each track with the streamId
                track._streamId = streamId;
                console.log(track);
            })
            console.log(stream);
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


    /** Attaches a given stream to a given peerConnection, if the stream exists, tracks are replaced if the device has changed
     * 
     * @param {string}         streamId - stream identifier string.
     * @param {peerConnection} peerConn - peerConnection object to attach stream to.
     * @returns 
     */
    attachStreamToPeerConnection(streamId, peerConn){

        const sendersArray = peerConn.getSenders();
        const stream = this.getStream(streamId);
        let exists = false;
        console.log("Attaching stream: ", streamId);
        
        if(!stream) { //checks that the stream exists
            console.warn("No stream found with for ID: ", streamId);
            return;
        }

        //check if any streams are already attached
        if (sendersArray === undefined || sendersArray.length === 0){ //if no streams exist
            console.log("New Stream detected, adding stream")
            stream.getTracks().forEach(track => { //add stream to connection
                peerConn.addTrack(track, stream);
            })
            return;
        }
        sendersArray.forEach(sender => { //iterate over senders

            if(sender.track._streamId === streamId) {  //if the streamId of a sender matches currently selected stream
                exists = true; //stream already exists
                stream.getTracks().forEach(track => { //get tracks for the new stream
                    if(track.kind === sender.track.kind) //if the track type and sender track type match, replace the track with the new track
                    {
                        if (sender.track.label === track.label)
                        {
                            console.log("Devices match, no update required");
                        } else{
                            console.log("Stream existed, replacing ", sender.track, " with ", track);
                            sender.replaceTrack(track);
                        }
                    } else {
                        console.log("sender kind: ",  sender.track.kind, " and track kind: ", track.kind, " do not match.")
                    }
                })
            }
        })
        if (exists === false) { //if stream was not found in senders array, it is new so attach stream as normal
            console.log("Stream is new, attaching stream");
            stream.getTracks().forEach(track => {
                peerConn.addTrack(track, stream);
            })
        }
    }
    
    routeStreamToElement(streamId, element) {
        if (this.streams[streamId]) {
            element.srcObject = this.streams[streamId];
            console.log("Routing ", streamId, " to ", element)
        }
    }
}
