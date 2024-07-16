// src/managers/AdapterManager.ts

import { OBDAdapter } from '../adapters/BaseOBDAdapter';
import { CarlyAdapter } from '../adapters/CarlyAdapter';
import { ELM327Adapter } from '../adapters/ELM327Adapter';
import BleManager from 'react-native-ble-manager';

export class AdapterManager {
  static async detectAdapter(device: any): Promise<OBDAdapter> {
    console.log('Detecting adapter for device:', device.name);

    const characteristics = await this.findCharacteristicUUIDs(device);
    console.log('Found characteristics:', characteristics);

    if (device.name) {
      // Check for Carly adapter
      if (device.name.toLowerCase().includes('carly')) {
        console.log('Detected Carly adapter');
        return new CarlyAdapter(device, characteristics);
      }

      // Check for other specific adapters
      // if (device.name.toLowerCase().includes('other_adapter_name')) {
      //   return new OtherAdapter(device, characteristics);
      // }

      // You can add more checks for other specific adapters here
    }

     // If no specific adapter is detected, default to ELM327
     console.log('Defaulting to ELM327 adapter');
     return new ELM327Adapter(device, characteristics);
  }
  
  private static async findCharacteristicUUIDs(device: any) {
    const services: any = await BleManager.retrieveServices(device.id);
    let writableCharacteristicUUID = null;
    let notifiableCharacteristicUUID = null;
    let serviceUUID = null;

    // Look for a service with both writable and notifiable characteristics
    for (const service of services.services) {
      const characteristics = services.characteristics.filter((c: any) => c.service === service.uuid);
      const writableChar = characteristics.find((c: any) => c.properties.Write || c.properties.WriteWithoutResponse);
      const notifiableChar = characteristics.find((c: any) => c.properties.Notify);

      if (writableChar && notifiableChar) {
        serviceUUID = service.uuid;
        writableCharacteristicUUID = writableChar.characteristic;
        notifiableCharacteristicUUID = notifiableChar.characteristic;
        break;
      }
    }

    // If not found, fall back to separate writable and notifiable characteristics
    if (!serviceUUID) {
      for (const characteristic of services.characteristics) {
        if (characteristic.properties.Write || characteristic.properties.WriteWithoutResponse) {
          writableCharacteristicUUID = characteristic.characteristic;
          serviceUUID = characteristic.service;
        }
        if (characteristic.properties.Notify) {
          notifiableCharacteristicUUID = characteristic.characteristic;
          if (!serviceUUID) serviceUUID = characteristic.service;
        }
      }
    }

    if (!writableCharacteristicUUID || !notifiableCharacteristicUUID) {
      throw new Error('Required characteristics not found');
    }

    return { serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID };
  }
}