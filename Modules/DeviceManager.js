// handle obtaining permission from user upon initialisation
// populate menus with currently attached devices
// repopulate menus when device change is detected
// return user selections to main programme




export class DeviceManager {
	constructor() {
		this.devicePermissions = false;
		this.devices = null;
		this.menuElements = []; // Array of objects: {selectElement, deviceKind, streamId)
	}

	async init() {
		await this.getPermissions();
		await this.getDevices();
	}
	
	//obtains user permissions
	async getPermissions() {
		try {
			await navigator.mediaDevices.getUserMedia({audio: true, video: true});
			console.log("User permission granted");
			this.devicePermissions = true;
		}
		catch (err) {
			console.error(err);
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
			menuName: selectElement, 
			deviceType: deviceKind, 
			streamId: streamId
		}; 
		let exists = false;

		//check if there are any menus in the array
		if(this.menuElements.length !== 0) {
			this.menuElements.forEach(menu => {
				if (item.menuName === menu.menuName) {
					// console.log("Menu already exists");
					exists = true;
				}
			})
			if (!exists) {
				this.menuElements.push(item);
			// console.log("New Menu Detected: Adding New Menu")
			}
		} else {
			this.menuElements.push(item);
			// console.log("No menus added yet, therefore Adding New Menu")
		}
		// console.log(this.menuElements);
		this.populateMenu(selectElement, deviceKind);
}

	//populates the menu with the currently connected devices
	populateMenu(selectElement, deviceKind) {
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
				selectElement.selectedIndex = 0;
			}
		});
	}

	//iterates over the menuElements array and repopulates the menus
	updateMenus() {
		this.menuElements.forEach(menu => {
			// console.log(menu);
			this.populateMenu(menu.menuName, menu.deviceType);
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
	
			const selectedDeviceId = menu.menuName.value;
			const deviceType = menu.deviceType;
	
			if (deviceType === 'videoinput') {
				constraints.video = { deviceId: { exact: selectedDeviceId } };
			} else if (deviceType === 'audioinput') {
				constraints.audio = { deviceId: { exact: selectedDeviceId } };
			}
		});
	
		return constraints;
	}

	

}

