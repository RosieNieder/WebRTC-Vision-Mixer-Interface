export class DeviceManager {
	constructor({videoInputSelect, audioInputSelect, commsInputSelect, monitorAudioOutputSelect, commsAudioOutputSelect}) {
			this.videoInputSelect = videoInputSelect;
			this.audioInputSelect = audioInputSelect;
			this.commsInputSelect = commsInputSelect;
			this.monitorAudioOutputSelect = monitorAudioOutputSelect;
			this.commsAudioOutputSelect = commsAudioOutputSelect;
	}

	async init() {
		//get permission for microphone and camera usage
		try {
			await navigator.mediaDevices.getUserMedia({audio: true, video: true});
			console.log("User permission granted");
			this.populateDeviceMenus();
		}
		catch (err) {
			console.error(err);
		}
	}
	
	async populateDeviceMenus() {
		const devices = await navigator.mediaDevices.enumerateDevices();
		this.clearDeviceMenus();

		devices.forEach(device => {
			const option = document.createElement('option');
			option.value = device.deviceId;
			option.text = device.label;

			switch (device.kind) {

			case 'videoinput':
				this.videoInputSelect.appendChild(option);
				this.videoInputSelect.selectedIndex = 0;
				break;
			case 'audioinput':
				this.audioInputSelect.appendChild(option);
				this.commsInputSelect.appendChild(option.cloneNode(true));
				this.audioInputSelect.selectedIndex = 0;
				this.commsInputSelect.selectedIndex = 0;
				break;
			case 'audiooutput':
				this.commsAudioOutputSelect.appendChild(option);
				this.monitorAudioOutputSelect.appendChild(option.cloneNode(true));
				this.commsAudioOutputSelect.selectedIndex = 0;
				this.monitorAudioOutputSelect.selectedIndex = 0;
				break;
			}
			
		});
		console.log("Populated device menus");
	}

	//gets currently selected values for stream contraints
	getPgmStreamConstraints() {
		const pgmVideoInput = this.videoInputSelect.value;
		const pgmAudioInput = this.audioInputSelect.value;

		return {
			video: {deviceId: pgmVideoInput ? {exact: pgmVideoInput} : undefined},
			audio: {deviceId: pgmAudioInput ? {exact: pgmAudioInput} : undefined}}
		}
	
	getCommsStreamConstraints() {
		const commsAudioInput = this.commsInputSelect.value;
		const commsAudioOutput = this.commsAudioOutputSelect.value;
		const monitorAudioOutput = this.monitorAudioOutputSelect.value;
		return {
			audio: {deviceId: commsAudioInput ? {exact: commsAudioInput} : undefined},
		}
	}

	getAudioMonitoringConfiguration() {
		const commsAudioOutput = this.commsAudioOutputSelect.value;
		const monitorAudioOutput = this.monitorAudioOutputSelect.value;
		return {
			commsAudioOutput: commsAudioOutput,
			monitorAudioOutput: monitorAudioOutput
		}
	}

	//iterates over the device menus and removes all children
	clearDeviceMenus() {
		while (this.videoInputSelect.firstChild) {
			this.videoInputSelect.removeChild(this.videoInputSelect.firstChild);
		}
		while (this.audioInputSelect.firstChild) {
			this.audioInputSelect.removeChild(this.audioInputSelect.firstChild);
		}
		while (this.commsInputSelect.firstChild) {
			this.commsInputSelect.removeChild(this.commsInputSelect.firstChild);
		}
		while (this.monitorAudioOutputSelect.firstChild) {
			this.monitorAudioOutputSelect.removeChild(this.monitorAudioOutputSelect.firstChild);
		}
		while (this.commsAudioOutputSelect.firstChild) {
			this.commsAudioOutputSelect.removeChild(this.commsAudioOutputSelect.firstChild);
		}
		console.log("Cleared device menus")
	}
}
