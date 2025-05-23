export class AudioMixer {
	constructor(deviceId) {
			this.audioContext = new AudioContext;
			this.destination = this.audioContext.createMediaStreamDestination();

			this.outputAudio = new Audio();
			this.outputAudio.srcObject = this.destination.stream;
			this.outputAudio.autoplay = true;

			this.setOutputDevice(deviceId);
	}

	async setOutputDevice(deviceId) {
		if (typeof this.outputAudio.setSinkId !== 'undefined') {
			try {
				await this.outputAudio.setSinkId(deviceId);
				console.log('Audio output device set to ${deviceId}')
			} catch (err) {
				console.error(err);
			}
		} else {
			console.warn('setSinkId() is not supported in this browser');
		}
	}

	addStream(stream, gainSlider) {
		const source = this.audioContext.createMediaStreamSource(stream);
		const gainNode = this.audioContext.createGain();
		// gainNode.gain.value = gainSlider.value;
		
		source.connect(gainNode).connect(this.destination);
	
		gainSlider.addEventListener(
				  "input",
				  () => {
					gainNode.gain.value = gainSlider.value;
				  },
				  false
				);
			
	} 

}