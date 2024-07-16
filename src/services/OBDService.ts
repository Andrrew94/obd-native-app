import { AdapterManager } from '../managers/AdapterManager';
import { CommandManager } from '../managers/CommandManager';
import { OBDAdapter } from '../adapters/BaseOBDAdapter';
import { BluetoothService } from './BluetoothService';

export class OBDService {
  private static adapter: OBDAdapter | null = null;

  static async connectAndInitialize(device: any): Promise<void> {
    console.log('Starting OBD connection and initialization...');
    try {
      await BluetoothService.connectToDevice(device);
      this.adapter = await AdapterManager.detectAdapter(device);
      await this.adapter.setupSubscription();

      const protocol = await this.adapter.detectProtocol();
      console.log('Detected protocol:', protocol);
  
      await this.adapter.initialize(protocol.code);
      console.log('OBD Adapter initialized successfully');

      await this.adapter.teardownSubscription().catch(console.error);
    } catch (error) {
      console.error('Error in OBD connection and initialization:', error);
      if (this.adapter) {
        await this.adapter.teardownSubscription().catch(console.error);
      }
      throw error;
    }
  }

  static async startLiveData(callback: (data: any) => void) {
    if (!this.adapter) throw new Error("Adapter not initialized");
  
    try {
      await this.adapter.setupSubscription();
      const liveMode1 = await this.adapter.queryMode1(['0C1']);
      console.log('liveMode1', liveMode1);
      
    } catch (error) {
      console.error('Error starting live data:', error);
      throw error;
    }
  }

  static async queryPIDs(pids: string[]): Promise<string> {
    if (!this.adapter) throw new Error("Adapter not initialized");

    try {
      await this.adapter.setupSubscription();
      const mode1Result = await this.adapter.queryMode1(pids);
      await this.adapter.teardownSubscription().catch(console.error);

      return mode1Result;
    } catch (error) {
      console.error('Error in querying Mode 1:', error);
      if (this.adapter) {
        await this.adapter.teardownSubscription().catch(console.error);
      }
      throw error;
    }
  }

  static async queryMode9(pids: string[]): Promise<string> {
    if (!this.adapter) throw new Error("Adapter not initialized");

    try {
      await this.adapter.setupSubscription();
      const mode1Result = await this.adapter.queryMode9(pids);
      await this.adapter.teardownSubscription().catch(console.error);

      return mode1Result;
    } catch (error) {
      console.error('Error in querying Mode 9:', error);
      if (this.adapter) {
        await this.adapter.teardownSubscription().catch(console.error);
      }
      throw error;
    }
  }

  static async queryDTCs(mode: '03' | '07' | '0A'): Promise<string[]> {
    if (!this.adapter) throw new Error("Adapter not initialized");
    const command = CommandManager.translateCommand(mode, this.adapter.constructor.name);
    await this.adapter.setupSubscription();
    const response = await this.adapter.queryDTCs(command);
    await this.adapter.teardownSubscription().catch(console.error);

    return response;
    // return ResponseParser.parse(response, this.adapter.constructor.name, command);
  }

  static async clearDTCs(): Promise<boolean> {
    if (!this.adapter) throw new Error("Adapter not initialized");
    const command = CommandManager.translateCommand('04', this.adapter.constructor.name);
    await this.adapter.setupSubscription();
    const response = await this.adapter.clearDTCs(command);
    await this.adapter.teardownSubscription().catch(console.error);
    return response;
  }

  static async disconnect(): Promise<void> {
    try {
      console.log('Disconnecting Bluetooth...');
      this.adapter = null;
      await BluetoothService.disconnect();
      console.log('Bluetooth disconnected');
    } catch (error) {
      console.error('Error disconnecting Bluetooth:', error);
    }
  }
}