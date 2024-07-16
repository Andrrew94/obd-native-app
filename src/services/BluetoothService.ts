import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export class BluetoothService {
  private static isScanning: boolean = false;

  static async scanForDevices(setDevices: (devices: any) => void): Promise<void> {
    if (this.isScanning) {
      console.log('Scan already in progress');
      return;
    }

    this.isScanning = true;

    try {
      // Start BLE manager
      await BleManager.start({ showAlert: false });

      // Clear existing devices
      setDevices([]);

      // Set up discovery listener
      bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        (device) => {
          if (device.name) {
            setDevices((prevDevices: any) => {
              if (!prevDevices.some((d: any) => d.id === device.id)) {
                return [...prevDevices, device];
              }
              return prevDevices;
            });
          }
        }
      );

      // Start scanning
      await BleManager.scan([], 5, true);
      console.log('Scanning...');

      // Set a timeout to stop scanning after 5 seconds
      setTimeout(() => {
        this.stopDeviceScan();
      }, 5000);

    } catch (error) {
      console.error('Error starting scan:', error);
    }
  }

  static stopDeviceScan(): void {
    if (!this.isScanning) {
      console.log('No scan in progress');
      return;
    }

    BleManager.stopScan()
      .then(() => {
        console.log('Scan stopped');
        this.isScanning = false;
        // Remove the discovery listener
        bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
      })
      .catch((error) => {
        console.error('Error stopping scan:', error);
      });
  }

  static async connectToDevice(device: any) {
    try {
      await BleManager.connect(device.id);
      console.log('Connected to device:', device.id);
    } catch (error) {
      console.error('Error connecting to device:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    try {
      const connectedDevices = await BleManager.getConnectedPeripherals([]);
      for (const device of connectedDevices) {
        await BleManager.disconnect(device.id);
        console.log(`Disconnected from device: ${device.id}`);
      }
    } catch (error) {
      console.error('Error disconnecting devices:', error);
      throw error;
    }
  }
}