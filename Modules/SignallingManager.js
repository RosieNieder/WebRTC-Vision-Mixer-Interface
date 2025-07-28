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
        this.updateStatus = this.updateStatus.bind(this);

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
            this.webSocket.close();
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
                    case "hang_up":
                        console.log("Other Peer Hung Up the Call")
                        this.cleanUp();
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
                    case "hang_up":
                        console.log("Other Peer Hung Up the Call")
                        this.cleanUp();
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

    hangUp() {
        this.sendData({
            type: "hang_up"
        })
        this.cleanUp();
    }


    cleanUp() {
        if (this.peerConn) {
       
            this.peerConn.ontrack = null;
            this.peerConn.onicecandidate = null;

            this.peerConn.getSenders().forEach(sender => {
                if (sender.track) sender.track.stop(); // Stop sending media
            });

            this.peerConn.close();
            this.peerConn = null;
            // console.log(this.peerConn);
        }
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

    updateStatus(state) {
    const statusBox = document.getElementById("ws-status");
    if (!statusBox) return;

    statusBox.classList.remove("connected", "disconnected", "error");

    switch (state) {
        case "connected":
            statusBox.classList.add("connected");
            statusBox.textContent = "WebSocket: Connected";
            break;
        case "disconnected":
            statusBox.classList.add("disconnected");
            statusBox.textContent = "WebSocket: Disconnected";
            break;
        case "error":
            statusBox.classList.add("error");
            statusBox.textContent = "WebSocket: Error";
            break;
    }
}

}

