export const initializeOBD = async (device: any) => {
    console.log('Initialize OBD adapter');
    const services = await device.services();
    const serviceUUID = services[0].uuid;
    const characteristics = await device.characteristicsForService(serviceUUID);
    const characteristicUUID = characteristics[0].uuid;
  
    const initCommands = [
      'ATZ',    // Reset the OBD-II adapter
      'ATE0',   // Turn off echo
      'ATL0',   // Turn off line feed
      'ATS0',   // Turn off spaces
      'ATH0',   // Turn off headers
      'ATSP0',  // Set protocol to auto
    ];
  
    for (const command of initCommands) {
      await device.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, command);
    }
  
    console.log('Initialization commands sent with success');
  };
  
  export const querySupportedPIDs = async (device: any) => {
    const services = await device.services();
    const serviceUUID = services[0].uuid;
    const characteristics = await device.characteristicsForService(serviceUUID);
    const characteristicUUID = characteristics[0].uuid;
    const pids = ['0100', '0120', '0140', '0160', '0180', '01A0'];
  
    const supportedPIDs = [];
    
    for (const pid of pids) {
      const response = await device.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, pid);
      supportedPIDs.push(response.value); // Parse the response as needed
    }
  
    return supportedPIDs;
  };
  