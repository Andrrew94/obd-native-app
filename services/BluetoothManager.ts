import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

export const scanForDevices = (setDevices: any) => {
console.log('Started scanning for devices');
  manager.startDeviceScan(null, null, (error, device: any) => {
    if (error) {
      console.error(error);
      return;
    }

    if (device.name) {
      setDevices((prevDevices: any) => {
        if (!prevDevices.find((d: any) => d.id === device.id)) {
          return [...prevDevices, device];
        }
        return prevDevices;
      });
    }
  });

  setTimeout(() => {
    manager.stopDeviceScan();
    console.log('Stopped scanning for devices');
  }, 10000); // Stop scanning after 10 seconds
};

export const stopDeviceScan = () => {
  manager.stopDeviceScan();
};

export const connectToDevice = async (device: any) => {
  try {
    const connectedDevice = await device.connect();
    await connectedDevice.discoverAllServicesAndCharacteristics();
    return connectedDevice;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
