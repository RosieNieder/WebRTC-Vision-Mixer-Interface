//TODO: Handling of ICE candidates
export class SignallingManager {
    constructor(peerConn, socketUrl, operator, type) {
        this.peerConn = peerConn;
        this.webSocket = new WebSocket(socketUrl);
        this.operator = operator;
        this.remoteStream;
        this.type = type;

        this.webSocket.onmessage = (event) => {
			console.log("Handling Signalling Data: ", JSON.parse(event.data));
            this.handleSignallingData(JSON.parse(event.data));
        };

        this.webSocket.addEventListener('open', (event) => {
            console.log('WebSocket Connection Success')
        })

        this.webSocket.addEventListener('error', () => {
            console.log('WebSocket Error');
        })
        this.webSocket.addEventListener('close', () => {
            console.log('WebSocket Closed');
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
        this.peerConn.onaddstream = (e) =>
        {
            this.remoteStream = e.stream;

            console.log(this.remoteStream);
            console.log("stream added")
            
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
                        this.peerConn.setRemoteDescription(data.offer);
                        this.createAndSendAnswer();
                        break
                    case "candidate":
                        this.peerConn.addIceCandidate(data.candidate);
                        break
            }   
            break
    }
}

    //send data to the server with the operator username to specify the call
    sendData(data) {
        data.username = this.operator;
        this.webSocket.send(JSON.stringify(data))
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
        if (this.peerConn.remoteDescription == null)
        {
            return;
        }
        this.peerConn.createAnswer()
        .then(answer=> {this.peerConn.setLocalDescription(answer)
            this.sendData({
                type: "send_answer",
                answer: this.peerConn.localDescription
            })
        })
        .catch(err => {
            console.error("error creating answer: ", err);
        })
        
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