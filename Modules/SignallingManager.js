export class SignallingManager {
    constructor(peerConn, socketUrl) {
        this.peerConn = peerConn;
        this.webSocket = new WebSocket(socketUrl);

        this.webSocket.onmessage = (event) => {
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
    }

//data received is either an SDP answer or an icecandidate, update peerConn as appropriate
    handleSignallingData(data) {
        switch(data.type) {
            case "answer":
                this.SignallingManagerpeerConn.setRemoteDescription(data.answer)
                break
            case "candidate":
                this.peerConn.addIceCandidate(data.candidate)
        }
    }

    //send data to the server with the operator username to specify the call
    sendData(data) {
        let operator = 'vision-mixer';
        data.username = operator;
        this.webSocket.send(JSON.stringify(data))
    }
    sendUser() {
        this.sendData({
            type: "store_user"
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
        })
        .catch(err => {
            console.error("Error creating offer: ", err);
        });
    }

    handleIceCandidates() {
		this.peerConn.onicecandidate = (e) => {
			if (e.candidate) {
				this.sendData({ type: "store_candidate", candidate: e.candidate });
			}
		};
	}
}