export class MediaManager {
    constructor(peerConn, videoMonitorElement, audioMonitorElement, commsAudioMonitorElement, remoteCommsAudioMonitorElement) {
        this.peerConn = peerConn;
        this.pgmStream = null;
        this.commsStream = null;
        this.pgmConstraints = {audio: true, video: true};
        this.commsConstraints = {audio: true};
        this.videoMonitor = videoMonitorElement;
        this.audioMonitor = audioMonitorElement;
        this.commsAudioMonitor = commsAudioMonitorElement;
        this.remoteCommsAudioMonitor = remoteCommsAudioMonitorElement;
    }

    init() {
        this.getStreams();
    }

    updateConstraints(pgmConstraints, commsConstraints) {
        this.pgmConstraints = pgmConstraints;
        this.commsConstraints = commsConstraints;
        console.log(this.pgmConstraints, this.commsConstraints);
    }

    async getStreams() {
        this.pgmStream = await navigator.mediaDevices.getUserMedia(this.pgmConstraints);
        this.commsStream = await navigator.mediaDevices.getUserMedia(this.commsConstraints);
        this.videoMonitor.srcObject = this.pgmStream;
        this.audioMonitor.srcObject = this.pgmStream;
        this.commsAudioMonitor.srcObject = this.commsStream;
        console.log(this.pgmStream, this.commsStream);
    }

    attachTracksToPeerConnection() {
        if (this.peerConn.getSenders().length > 0) {	
            console.log("Peer connection already has senders");
            this.peerConn.getSenders().forEach(sender => {
                if (sender.track.kind === 'video') {
                    this.peerConn.removeTrack(sender);
                }
                else if (sender.track.kind === 'audio') {
                    this.peerConn.removeTrack(sender);
                }
            });
        }
        for (const track of this.pgmStream.getTracks()) {
            this.peerConn.addTrack(track, this.pgmStream);
        }
        for (const track of this.commsStream.getTracks()) {
            this.peerConn.addTrack(track, this.commsStream);
        }
        console.log(peerConn.getSenders());
    }
}