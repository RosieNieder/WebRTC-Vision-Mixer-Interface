//TODO:
export class SignallingManager {
    constructor(peerConn, socketUrl, operator, type) {
        this.peerConn = peerConn;
        this.webSocket = new WebSocket(socketUrl);
        this.socketUrl = socketUrl;
        this.operator = operator;
        this.remoteStream;
        this.incomingStreams ={};
        this.type = type;
        this.socketOpen = false;

        this.webSocket.onmessage = (event) => {
			console.log("Handling Signalling Data: ", JSON.parse(event.data));
            this.handleSignallingData(JSON.parse(event.data));
        };

        this.webSocket.addEventListener('open', (event) => {
            console.log('WebSocket Connection Success')
            this.socketOpen = true;
        })

        this.webSocket.addEventListener('error', (err) => {
            console.log('WebSocket Error: ', err.err);
            this.webSocket.close;
            this.socketOpen = false;
        })
        this.webSocket.addEventListener('close', () => {
            console.log('WebSocket Closed');
            setLocalDescription()
            
            this.socketOpen = false;
        })

        this.peerConn.onicecandidate = (e) => {
			if (e.candidate) {
                console.log(e.candidate);
                if (e.candidate == null){
                return;
                }
                else {
                switch(this.type) {
                case "caller":
                    console.log("store candidate data")
				    this.sendData({ type: "store_candidate", candidate: e.candidate });
                break;
                case "receiver":
                    this.sendData({ type: "send_candidate", candidate: e.candidate });
                }
            }
			}
		};

       this.peerConn.ontrack = (event) => {
        //when a track is added to the connection it needs to be saved in an array with its associated streamId
        //then when monitors are populated, the array can be inspected and for the tracks with matching streamIds, a programme stream can be created, and a for the lone Id, a comms stream can be created and assigned
        //this should happen in the main programme, as the handling of the streams is unique to the caller and receiver

        const stream = event.streams[0];
        console.log(stream);
        const streamId = stream.id;
        console.log(streamId)
        const track = event.track;
        console.log(track)

        
        if (!this.incomingStreams[streamId]) {
            this.incomingStreams[streamId] = [];
            
        
        } 
            this.incomingStreams[streamId].push(track);    
        
        
        // console.log(event.track, event.streams);

        // if (!this.remoteStream) {
        //     this.remoteStream = new MediaStream();
        // }
        //     this.remoteStream.addTrack(event.track);
        //     console.log("Stream added by remote: ", this.remoteStream)
        // }
}
    }

//data received is either an SDP answer or an icecandidate, update peerConn as appropriate
    handleSignallingData(data) {
        switch(this.type) { //check the type of node -> caller is local, receiver is remote
            case "caller":
                switch(data.type) { //caller receives answers and candidates from remote
                    case "answer": 
                        this.peerConn.setRemoteDescription(data.answer)
                        break
                    case "candidate":
                        this.peerConn.addIceCandidate(data.candidate)
                        break
                }
                break
            case "receiver": //receiver receives offers and candidates from local
                switch(data.type) {
                    case "offer":
                        console.log("received offer")
                        this.peerConn.setRemoteDescription(data.offer).then(()=> {
                            console.log(this.peerConn.remoteDescription)
                            this.createAndSendAnswer();
                        }).catch((err) =>{
                            console.log(err);
                        })
                        //console.log(this.peerConn.remoteDescription);
                        
                        break
                    case "candidate":
                        console.log("received candidate")
                        this.peerConn.addIceCandidate(data.candidate);
                        break
            }   
            break
    }
}

    //send data to the server with the operator username to specify the call
    sendData(data) {
        if (this.socketOpen === true){
        data.username = this.operator;
        this.webSocket.send(JSON.stringify(data))
        }
        else {
            console.warn("Websocket not open, data not sent: ", data)
        }
    }
    sendUser() {
        this.sendData({
            type: "store_user",
            username: this.operator
        })
    }

    joinCall(){
        this.sendData({
            type: "join_call"
        })
    }


    createAndSendAnswer(){
        console.log('creating and sending answer')
        if (this.peerConn.remoteDescription == null)
        {
            return;
        }
        try {
            this.peerConn.createAnswer().then((answer) => {
                this.peerConn.setLocalDescription(answer)
                console.log("answer: ", answer)
                this.sendData({
                    type: "send_answer",
                    answer: answer
                })
            })
            
        }
        catch (err){
            console.log(err);
        }
    }
        

    createAndSendOffer() {
        this.peerConn.createOffer()
        .then(offer => this.peerConn.setLocalDescription(offer))
        .then(()=> {
            this.sendData({
                type: "store_offer",
                offer: this.peerConn.localDescription       
            });
            console.log(this.peerConn.localDescription);
        })
        .catch(err => {
            console.error("Error creating offer: ", err);
        });
    }

    inspect(){
        console.log("Peer Connection: ", this.peerConn);
        console.log("Local description ", this.peerConn.localDescription);
        console.log("Remote description: ", this.peerConn.remoteDescription);
    }

}

