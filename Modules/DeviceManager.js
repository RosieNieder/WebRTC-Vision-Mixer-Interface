/*
 * DeviceManager handles media device permissions, enumeration, and
 * dynamic UI menu population for audio/video input/output selection.
 *
 * Responsibilities:
 * - Request media permissions
 * - Fetch and manage media device lists
 * - Attach HTML <select> menus to allow device selection
 * - Handle device changes and keep menus updated
 *
 * Typical usage:
 * const dm = new DeviceManager();
 * await dm.init();
 * dm.addMenu(selectEl, 'audioinput', 'comms');
 * const constraints = dm.getStreamConstraints('comms');
 */

export class DeviceManager {
	constructor() {
		this.devicePermissions = false;
		this.devices = null;
		this.menuElements = []; // Array of objects: {selectElement, deviceKind, streamId)
		
		navigator.mediaDevices.ondevicechange = (event) => {
			this.handleAttachedDeviceChange();
		}
	}

	/**
	 * Requests device permissions and populates device list
	 * Should be called once before using device menus
	 */
	async init() {
		const success = await this.getPermissions();
		if (success) {
			await this.getDevices();
		}  else {
			console.warn('DeviceManager initialisation failed: no perimissions');
		}
	}
	
	/**
	 * Called by 'init()'
	 * Prompts user for device permissions
	 * sets 'devicePermissions' to true on success
	 * Call before calling 'getDevices()'
	 */
	async getPermissions() {
		try {
			await navigator.mediaDevices.getUserMedia({audio: true, video: true});
			console.log("User permission granted");
			this.devicePermissions = true;
			return true;
		}
		catch (err) {
			console.error(err);
			return false;
		}
	
	}

	//gets list of currenlty connected devices
	async getDevices() {
		if(this.devicePermissions === true)
		{
			this.devices = await navigator.mediaDevices.enumerateDevices();
		} else {
			console.warn("User permissions not granted, please reset permissions and reload page.")
		}
	}

	/**
	 * Adds a device selection menu to be managed and updated
	 * 
	 * @param {HTMLSelectElement} selectElement - The <select> element to populate.
	 * @param {string} 		  	  deviceKind 	- One of: 'audioinput', 'videoinput', 'audiooutput'
	 * @param {string} 			  streamId 		- Identifier used for later retrieving stream constraints.
	 */
	addMenu(selectElement, deviceKind, streamId){ //HTML select element, device kind (audioinput, videoinput, audiooutput), streamId (programme, comms, monitor)
		
		if (!selectElement || typeof selectElement.options === 'undefined') {
			console.warn("Invalid select element");
			return;
		  }
		
		const item = {
			selectElement: selectElement, 
			deviceType: deviceKind, 
			streamId: streamId
		}; 
		let exists = false;

		//check if there are any menus in the array
		if(this.menuElements.length !== 0) {
			this.menuElements.forEach(menu => {
				if (item.selectElement === menu.selectElement) {
		
					exists = true;
				}
			})
			if (!exists) {
				this.menuElements.push(item);
		
			}
		} else {
			this.menuElements.push(item);
		
		}
		this.populateMenu(selectElement, deviceKind);
}

/** Populates a given <select> menu with the currently connected devices of a given type
 * Tries to preseve previous selection if available
 * 
 * @param {HTMLSelectElement} selectElement - The menu to populate
 * @param {string} 			  deviceKind	- One of: 'audioinput', 'videoinput', 'audiooutput'.
 */
	populateMenu(selectElement, deviceKind) {
		if (this.devicePermissions === false) {
			console.warn("Permissions not granted, reset permissions and reload page")
			return;
		}
		const previousSelectionDeviceId = selectElement.value
		//clear menu before populating if it exists
		if (selectElement.length > 0) {
			while (selectElement.firstChild) {
				selectElement.removeChild(selectElement.firstChild);
			}
		}
		this.devices.forEach(device => {
			const option = document.createElement('option');
			option.value = device.deviceId;
			option.text = device.label

			if (device.kind === deviceKind) {
				selectElement.appendChild(option);
			}
		});

		// Try to restore previous selection if still available
		const stillAvailable = Array.from(selectElement.options).some(
			option => option.value === previousSelectionDeviceId
		);

		if (stillAvailable) {
			selectElement.value = previousSelectionDeviceId;
		} else if (selectElement.options.length > 0) {
			// Default to first option if previous not available
			selectElement.selectedIndex = 0;
		}
	}

//iterates over the menuElements array and repopulates the menus
	updateMenus() {
		this.menuElements.forEach(menu => {
			// console.log(menu);
			this.populateMenu(menu.selectElement, menu.deviceType);
		})
	}


//call on device change event to update menus with currently connected devices
	async handleAttachedDeviceChange() {
		console.log("Detected change in available devices")
		//get updated device list
		await this.getDevices();
		this.updateMenus();
		// this.getUpdatedSelection();
	}


/** 
 * Builds media constraints for a specfic streamId
 * 
 * @param 	{string} 				 streamId - The stream ID to build constraints for
 * @returns {MediaStreamConstraints}		  - An object suitable for getUserMedia()
 */
	getStreamConstraints(streamId) {

		const constraints = { audio: false, video: false };
	
		this.menuElements.forEach(menu => {
			if (menu.streamId !== streamId) return;
	
			const selectedDeviceId = menu.selectElement.value;
			const deviceType = menu.deviceType;
	
			if (deviceType === 'videoinput') {
				constraints.video = { deviceId: { exact: selectedDeviceId } };
			} else if (deviceType === 'audioinput') {
				constraints.audio = { deviceId: { exact: selectedDeviceId } };
			}
		});
	
		return constraints;
	}

/**
 * A helper function for inspecting current selection values
 */
	getCurrentDeviceSelection(){
		const currentSelection = [];
		this.menuElements.forEach(menu => {
			const selectedIndex = menu.selectElement.selectedIndex;
			currentSelection.push({deviceId: menu.selectElement.value, deviceLabel: menu.selectElement.options[selectedIndex].text, deviceKind: menu.deviceType});
		})
		return currentSelection;
	}
}

/**
 * Example:
 * 
 * const deviceManager = new DeviceManager();
 * await deviceManager.init();
 * 
 * deviceManager.addMenu(audioInputSelectEl, 'audioinput', 'programme');
 * 
 * const constraints = deviceManager.getStreamConstraints('programme');
 * const stream = await navigator.mediaDevices.getUserMedia(constraints);
 */