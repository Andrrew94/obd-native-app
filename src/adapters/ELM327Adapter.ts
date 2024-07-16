// src/adapters/ELM327Adapter.ts

import { BaseOBDAdapter, AdapterCharacteristics } from './BaseOBDAdapter';
import { NativeEventEmitter, NativeModules } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import { MODE_1_PIDS } from '../../PIDS/mode-1-pids';
import { MODE_9_PIDS } from '../../PIDS/mode-9-pids';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export class ELM327Adapter extends BaseOBDAdapter {
  private notificationListener: any = null;
  private responseBuffer: string = '';
  private currentProtocol: string = '';
  private responseResolver: ((value: string) => void) | null = null;

  constructor(device: any, characteristics: AdapterCharacteristics) {
    super(device, characteristics);
  }

  async detectProtocol(): Promise<{ name: string, code: string }> {
    const protocols = [
      { name: 'ISO 15765-4 (CAN)', code: '6' },
      { name: 'ISO 14230-4 (KWP2000)', code: '5' }, // minmum support for now, but seems to be working, i suggest we do this after we finish CAN implementation
      { name: 'ISO 9141-2', code: '3' }, // TBD if we support it since it's for cars year ~2004
      { name: 'SAE J1850 VPW', code: '2' }, // TBD if we support it since it's for cars year ~2008
      { name: 'SAE J1850 PWM', code: '1' } // TBD if we support it since it's for cars year ~2008
    ];
    
    for (const protocol of protocols) {
      try {
        console.log(`Testing protocol: ${protocol.name}`);
        await this.sendCommandAndWaitForResponse(`ATSP${protocol.code}`);
        
        // Request RPM data (PID 0C for Mode 01)
        const response = await this.sendCommandAndWaitForResponse('010C');
        
        if (this.isValidRPMResponse(response)) {
          console.log(`Protocol detected: ${protocol.name}`);

          return {
            name: protocol.name,
            code: protocol.code,
          };
        }
      } catch (error) {
        console.log(`Failed to test protocol ${protocol.name}: ${error}`);
      }
    }
    
    throw new Error('Unable to detect protocol');
  }
  
  async fallbackCANDetection(): Promise<string | null> {
    try {
      // Enable headers
      await this.sendCommandAndWaitForResponse('ATH1');
      
      // Request VIN (usually returns a multi-line response)
      const response = await this.sendCommandAndWaitForResponse('0902');
      
      // Disable headers
      await this.sendCommandAndWaitForResponse('ATH0');
      
      // Check the length of the header
      const headerLength = response.split('\r')[0].length;
      const idBits = headerLength > 3 ? "29" : "11";
      
      // Use the current protocol to determine the baud rate
      const baudRate = this.currentProtocol.includes('500') ? "500" : "250";
      
      return `${idBits} bit ID, ${baudRate} kbit/s`;
    } catch (error) {
      console.log('Error in fallback CAN detection:', error);
      return null;
    }
  }

  private isValidRPMResponse(response: string): boolean {
    // Remove any whitespace and non-alphanumeric characters
    const cleanResponse = response.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    
    // Check if the response contains '410C' followed by at least 4 hexadecimal digits
    const regex = /410C[0-9A-F]{4,}/i;
    return regex.test(cleanResponse);
}

  async setupSubscription(): Promise<void> {
    if (this.notificationListener) {
      console.log('Subscription already set up');
      return;
    }

    try {
      await BleManager.startNotification(
        this.device.id,
        this.characteristics.serviceUUID,
        this.characteristics.notifiableCharacteristicUUID
      );
      
      this.notificationListener = bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        ({ value }) => {          
          const chunk = Buffer.from(value).toString('utf8');
          console.log('value retrieved from notification', chunk);
          this.handleNotification(chunk);
        }
      );

      console.log('Successfully set up a subscription');
    } catch (error: any) {
      console.error('Failed to set subscription or listener', error);
    }
  }

  private handleNotification(value: string) {
    console.log('Notification received:', value);
    this.responseBuffer += value;
    if (this.isResponseComplete(this.responseBuffer)) {
      if (this.responseResolver) {
        this.responseResolver(this.responseBuffer);
        this.responseResolver = null;
      }
      this.responseBuffer = '';
    }
  }

  async teardownSubscription(): Promise<void> {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }

    await BleManager.stopNotification(
      this.device.id,
      this.characteristics.serviceUUID,
      this.characteristics.notifiableCharacteristicUUID
    );

    this.responseBuffer = '';
    if (this.responseResolver) {
      this.responseResolver('Subscription closed');
      this.responseResolver = null;
    }

    console.log('Remove notification listener - Success');
  }

  async initialize(protocolCode: string): Promise<void> {
    console.log('Initializing ELM327 adapter');
    try {
      const commands = [
        { command: 'ATZ', description: 'Reset OBD-II adapter' },
        { command: 'ATE0', description: 'Turn off echo' },
        { command: `ATSP${protocolCode}`, description: 'Set comunication protocol' }, // passing the previosuly detected protocol and initializing the adapter with it
        { command: 'ATL0', description: 'Turn off line feed' },
        { command: 'ATS0', description: 'Turn off spaces' },
        { command: 'ATH0', description: 'Turn off headers' },
      ];

      for (const { command } of commands) {
        await this.sendCommandAndWaitForResponse(command);
      }
    } catch (error) {
      console.error('Failed to initialize OBD adapter:', error);
      throw error;
    }
  }

  async sendCommandAndWaitForResponse(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to command: ${command}`));
      }, 5000);
  
      let fullResponse = '';
  
      const responseHandler = (response: string) => {
        fullResponse += response;
        if (this.isResponseComplete(fullResponse)) {
          clearTimeout(timeoutId);
          resolve(fullResponse);
          this.responseResolver = null;
        }
      };
  
      this.responseResolver = responseHandler;
  
      this.sendCommand(command).catch(reject);
    });
  }
  
  private isResponseComplete(response: string): boolean {
    return response.includes('>') || response.includes('ERROR') || response.includes('NO DATA');
  }

  async sendCommand(command: string): Promise<void> {
    const commandBuffer = Buffer.from(`${command}\r`, 'ascii').toJSON().data;
    console.log(`Sending command: ${command}`);

    await BleManager.write(
      this.device.id,
      this.characteristics.serviceUUID,
      this.characteristics.writableCharacteristicUUID,
      commandBuffer
    );
  }

  async queryMode1(pids: string[]): Promise<any> {
    try {
      const results = [];
      for (const pid of pids) {
        const response = await this.sendCommandAndWaitForResponse(`01${pid}`);
        const cleanedResponse = this.cleanResponse(response);
        const parsedResponse = this.parseMode1Response(cleanedResponse);
        results.push(parsedResponse);
      }
  
      return results;
    } catch (error) {
      console.error('Failed to query Mode 1:', error);
      throw error;
    }
  }

  async queryMode9(pids: string[]): Promise<any> {
    try {
      const results = [];
      for (const pid of pids) {
        const response = await this.sendCommandAndWaitForResponse(`09${pid}`);
        const parsedResponse = this.interpretMode9Values(response);
        results.push(...parsedResponse);
      }
  
      const vinParts = results.filter(r => r.pid === '02');
      if (vinParts.length > 0) {
        const fullVin = this.assembleVIN(vinParts);
        results.push({
          description: 'Vehicle Identification Number (VIN)',
          data: fullVin
        });
      } else {
        console.log('No VIN parts found to assemble');
      }
  
      return results[results.length-1].data;
    } catch (error) {
      console.error('Failed to query Mode 1:', error);
      throw error;
    }
  }

  private interpretMode9Values = (response: string) => {
    const values: any = [];
    const pid = '02';  // VIN PID
  
    if (response.includes('NO DATA')) {
      console.log('No data available for this request');
      return values;
    }
  
    // Look for all VIN parts in the response
    const vinMatches = response.matchAll(/(\d+): ([0-9A-Fa-f]+)/g);
    
    for (const match of vinMatches) {
      const [, partNumberStr, vinHex] = match;
      const partNumber = parseInt(partNumberStr, 10);
      
      // Remove the '4902' prefix if present
      const cleanedVinHex = vinHex.replace(/^4902/, '');
      
      const vinPartialBytes = cleanedVinHex.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || [];
      const { Unit, Formula } = MODE_9_PIDS[pid];
      const partialVin = Formula(...vinPartialBytes);
      
      values.push({
        pid,
        description: `VIN Part ${partNumber}`,
        unit: Unit,
        data: partialVin,
        note: `Partial VIN - Part ${partNumber}`,
        partNumber
      });
    }
  
    if (values.length === 0) {
      console.error('VIN data not found in response');
    }
  
    return values;
  };

  private assembleVIN = (vinParts: any[]) => {
    // Sort the parts by their part number and remove duplicates
    const uniqueParts = vinParts.reduce((acc, current) => {
      const x = acc.find((item: any) => item.partNumber === current.partNumber);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);
    
    uniqueParts.sort((a: any, b: any) => a.partNumber - b.partNumber);
  
    // Concatenate the parts
    let fullVin = uniqueParts.map((part: any) => part.data).join('');
  
    // Remove any non-alphanumeric characters
    fullVin = fullVin.replace(/[^A-Z0-9]/gi, '');
  
    // Ensure the VIN is exactly 17 characters long
    fullVin = fullVin.slice(0, 17);
  
    return fullVin;
  };
  

  private cleanResponse(response: string): string {
    // Remove "SEARCHING...", duplicates, and other unexpected parts
    return response.replace(/SEARCHING\.\.\.|NO DATA|>/g, '').replace(/ +/g, '').trim();
  }

  private parseMode1Response(response: string) {
    const match = response.match(/^41(\w{2})(.*)/);
    if (!match) {
      throw new Error(`Unexpected response mode: ${response.slice(0, 2)}`);
    }

    const pid = match[1];
    const data = match[2];
    const pidDefinition = MODE_1_PIDS[pid];

    if (!pidDefinition) {
      throw new Error(`Unknown PID: ${pid}`);
    }

    const dataBytes = [];
    for (let i = 0; i < data.length; i += 2) {
      dataBytes.push(parseInt(data.substring(i, i + 2), 16));
    }

    const result = pidDefinition.Formula(...dataBytes);
    return {
      pid: pidDefinition.PID,
      description: pidDefinition.Description,
      unit: pidDefinition.Unit,
      data: result
    };
  }

  async queryDTCs(command: '03' | '07' | '0A') {
    try {
      const response = await this.sendCommandAndWaitForResponse(command);
      // Clean the response buffer
      const cleanedResponse = this.cleanResponseForDTCS(response, command);

      // Interpret the DTC values
      const interpretedValues = this.interpretDTCValues(cleanedResponse, command);
  
      return interpretedValues;
    } catch (error) {
      console.error('Error during DTC query:', error);
    }
  };

  async clearDTCs(command: '04') {
    try {
      const response = await this.sendCommandAndWaitForResponse(command);
      const cleanedResponse = response.replace(/[\r\n>]/g, '').trim();

      if (cleanedResponse.includes('44')) {
        return { success: true, message: 'DTCs cleared successfully' };
      } else {
        return { success: false, message: 'Failed to clear DTCs', response: cleanedResponse };
      }
    } catch (error) {
      console.error('Error during DTC query:', error);
    }
  };

  private interpretDTCValues = (response: string, mode: '03' | '07' | '0A') => {
    const interpretedValues = [];
    let modeIdentifier;
    let dtcType;
  
    switch(mode) {
      case '03':
        modeIdentifier = '43';
        dtcType = 'stored';
        break;
      case '07':
        modeIdentifier = '47';
        dtcType = 'pending';
        break;
      case '0A':
        modeIdentifier = '4A';
        dtcType = 'permanent';
        break;
    }
  
    if (response.startsWith(modeIdentifier)) {
      const data = response.substring(2);
      const numDTCs = parseInt(data.substring(0, 2), 16);
      console.log(`Number of ${dtcType} DTCs: ${numDTCs}`);
  
      const dtcData = data.substring(2);
      const dtcCodes = dtcData.match(/.{4}/g) || [];
  
      for (let i = 0; i < numDTCs && i < dtcCodes.length; i++) {
        const dtc = dtcCodes[i];
        if (dtc !== '0000') {
          const firstByte = parseInt(dtc.substring(0, 2), 16);
          const secondByte = parseInt(dtc.substring(2, 4), 16);
  
          const type = ['P', 'C', 'B', 'U'][firstByte >> 6];
          const firstChar = (firstByte >> 4) & 0x03;
          const secondChar = firstByte & 0x0F;
          const thirdChar = secondByte >> 4;
          const fourthChar = secondByte & 0x0F;
  
          const fullDTC = `${type}${firstChar}${secondChar.toString(16).toUpperCase()}${thirdChar.toString(16).toUpperCase()}${fourthChar.toString(16).toUpperCase()}`;
          interpretedValues.push(fullDTC);
        }
      }
  
      if (interpretedValues.length < numDTCs) {
        console.warn(`Warning: Only ${interpretedValues.length} out of ${numDTCs} ${dtcType} DTCs were interpreted. The response may be incomplete.`);
      }
    } else {
      console.error(`Unexpected response format for Mode ${mode}:`, response);
    }
  
    return interpretedValues;
  };
  
  private cleanResponseForDTCS = (response: any, mode: '03' | '07' | '0A') => {
    // Remove "SEARCHING..." and other non-data parts
    let cleaned = response.replace(/SEARCHING\.\.\./g, '')
                          .replace(/7F0031/g, '')  // Remove this error code if present
                          .replace(/\d+:\s*/g, '')
                          .replace(/[\r\n>]/g, '')
                          .trim();
    
    let headerValue;
  
    switch(mode) {
      case '03':
        headerValue = '43';
        break;
      case '07':
        headerValue = '47';
        break;
      case '0A':
        headerValue = '4A';
        break;
    }
  
    // Ensure the response starts with mode header value ex: 43, 47, 4A
    const dataStart = cleaned.indexOf(headerValue);
    if (dataStart !== -1) {
      cleaned = cleaned.substring(dataStart);
    }
    
    return cleaned;
  };
}