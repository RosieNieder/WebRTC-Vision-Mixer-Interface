// handle obtaining permission from user upon initialisation
// populate menus with currently attached devices
// repopulate menus when device change is detected
// return user selections to main programme

export class DeviceManager {
	constructor() {
		this.devicePermissions = false;
		this.devices = null;
		this.menuElements = []; // Array of objects: {selectElement, deviceKind, streamId)
		
		navigator.mediaDevices.ondevicechange = (event) => {
			this.handleAttachedDeviceChange();
		}
	}

	async init() {
		const success = await this.getPermissions();
		if (success) {
			await this.getDevices();
		}  else {
			console.warn('DeviceManager initialisation failed: no perimissions');
		}
	}
	
	//obtains user permissions
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

	//adds a menu to the menuElements array
	addMenu(selectElement, deviceKind, streamId){ //HTML select element, device kind (audioinput, videoinput, audiooutput), streamId (programme, comms, monitor)
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

	//populates the menu with the currently connected devices
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

	getCurrentDeviceSelection(){
		const currentSelection = [];
		this.menuElements.forEach(menu => {
			const selectedIndex = menu.selectElement.selectedIndex;
			currentSelection.push({deviceId: menu.selectElement.value, deviceLabel: menu.selectElement.options[selectedIndex].text, deviceKind: menu.deviceType});
		})
		return currentSelection;
	}
}

