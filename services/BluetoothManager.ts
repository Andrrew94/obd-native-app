import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules, Platform, PermissionsAndroid } from 'react-native';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export const scanForDevices = (setDevices: any) => {
  BleManager.start({ showAlert: false })
    .then(() => {
      BleManager.scan([], 5, true)
        .then(() => {
          console.log('Scanning...');
          bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (device) => {
            setDevices((prevDevices: any) => {
              if (device.name && !prevDevices.some((d: any) => d.id === device.id)) {
                return [...prevDevices, device];
              }
              return prevDevices;
            });
          });
        })
        .catch((error) => console.error('Error scanning:', error));
    })
    .catch((error) => console.error('Error starting BLE manager:', error));
};

export const stopDeviceScan = () => {
  BleManager.stopScan()
    .then(() => {
      console.log('Scan stopped');
    })
    .catch((error) => console.error('Error stopping scan:', error));
};

export const connectToDevice = (device: any) => {
  return new Promise((resolve, reject) => {
    BleManager.connect(device.id)
      .then(() => {
        console.log('Connected to device:', device.id);
        resolve(device);
      })
      .catch((error) => {
        console.error('Error connecting to device:', error);
        reject(error);
      });
  });
};
