import { NativeEventEmitter, NativeModules } from 'react-native';
import { AdapterCharacteristics, BaseOBDAdapter } from './BaseOBDAdapter';
import BleManager from 'react-native-ble-manager';
import { MODE_1_PIDS } from '../../PIDS/mode-1-pids';
import { Buffer } from 'buffer';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);


export class CarlyAdapter extends BaseOBDAdapter {
  private notificationListener: any = null;
  private responseBuffer: string = '';
  private currentProtocol: string = '';
  private responseResolver: ((value: string) => void) | null = null;
  private isSubscribed: boolean = false;

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

  // async setupSubscription(): Promise<void> {
  //   if (this.notificationListener) {
  //     console.log('Subscription already set up');
  //     return;
  //   }

  //   try {
  //     await BleManager.startNotification(
  //       this.device.id,
  //       this.characteristics.serviceUUID,
  //       this.characteristics.notifiableCharacteristicUUID
  //     );
      
  //     this.notificationListener = bleManagerEmitter.addListener(
  //       'BleManagerDidUpdateValueForCharacteristic',
  //       ({ value }) => {          
  //         const chunk = Buffer.from(value).toString('utf8');
  //         console.log('value retrieved from notification', chunk);
  //         this.handleNotification(chunk);
  //       }
  //     );

  //     console.log('Successfully set up a subscription');
  //   } catch (error: any) {
  //     console.error('Failed to set subscription or listener', error);
  //   }
  // }

  async setupSubscription(): Promise<void> {
    if (this.isSubscribed) {
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

      this.isSubscribed = true;
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

  // async teardownSubscription(): Promise<void> {
  //   if (this.notificationListener) {
  //     this.notificationListener.remove();
  //     this.notificationListener = null;
  //   }

  //   await BleManager.stopNotification(
  //     this.device.id,
  //     this.characteristics.serviceUUID,
  //     this.characteristics.notifiableCharacteristicUUID
  //   );

  //   this.responseBuffer = '';
  //   if (this.responseResolver) {
  //     this.responseResolver('Subscription closed');
  //     this.responseResolver = null;
  //   }

  //   console.log('Remove notification listener - Success');
  // }

  async teardownSubscription(): Promise<void> {
    if (!this.isSubscribed) return;

    try {
      await BleManager.stopNotification(
        this.device.id,
        this.characteristics.serviceUUID,
        this.characteristics.notifiableCharacteristicUUID
      );
      if (this.notificationListener) {
        this.notificationListener.remove();
        this.notificationListener = null;
      }
      this.isSubscribed = false;
      console.log('Subscription stopped');
    } catch (error) {
      console.error('Failed to stop subscription', error);
    }
  }

  async initialize(protocolCode: string): Promise<void> {
    console.log('Initializing Carly adapter');
    try {
      const commands = [
        // { command: 'ATZ', description: 'Reset OBD-II adapter' },
        // { command: 'ATE0', description: 'Turn off echo' },
        { command: `ATSP${protocolCode}`, description: 'Set comunication protocol' }, // passing the previosuly detected protocol and initializing the adapter with it
        // { command: 'ATL0', description: 'Turn off line feed' },
        // { command: 'ATS0', description: 'Turn off spaces' },
        // { command: 'ATH0', description: 'Turn off headers' },
      ];

      for (const { command } of commands) {
        await this.sendCommandAndWaitForResponse(command);
      }
    } catch (error) {
      console.error('Failed to initialize OBD Carly adapter:', error);
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
  
      if (results.length > 0) {
        console.log('Final VIN:', results[0].data);
        return results[0].data;  // This should be the correctly parsed VIN
      } else {
        throw new Error('No VIN data found');
      }
    } catch (error) {
      console.error('Failed to query Mode 9:', error);
      throw error;
    }
  }

  private interpretMode9Values = (response: string) => {
    console.log('RESULT to interpret', response);
    
    const values: any = [];
    const pid = '02';  // VIN PID
  
    if (response.includes('NO DATA')) {
      console.log('No data available for this request');
      return values;
    }
  
    // Split the response into lines and remove empty lines
    const lines = response.split('\n').filter(line => line.trim() !== '');
    
    // Remove the first line (echo) and the last line (terminator)
    const dataLines = lines.slice(1, -1);
    
    let vinHex = '';
    dataLines.forEach((line, index) => {
      // Remove spaces and split into bytes
      const bytes = line.replace(/\s/g, '').match(/.{2}/g) || [];
      
      let dataBytes;
      if (index === 0) {
        // For the first line, skip the first 4 bytes (header, mode, and PID)
        dataBytes = bytes.slice(4);
      } else {
        // For subsequent lines, skip only the first byte (header)
        dataBytes = bytes.slice(1);
      }
      
      vinHex += dataBytes.join('');
    });
  
    // Convert hex to ASCII, filtering out any non-printable characters
    const vin = vinHex.match(/.{2}/g)
      ?.map(hex => {
        const charCode = parseInt(hex, 16);
        return (charCode >= 32 && charCode <= 126) ? String.fromCharCode(charCode) : '';
      })
      .join('') || '';
  
    values.push({
      pid,
      description: 'Vehicle Identification Number (VIN)',
      unit: 'String',
      data: vin,
      note: 'Full VIN',
      partNumber: 1
    });
  
    if (values.length === 0) {
      console.error('VIN data not found in response');
    }
  
    console.log('Parsed VIN:', vin);
    return values;
  };
  

  private cleanResponse(response: string): string {
    // Remove "SEARCHING...", duplicates, and other unexpected parts
    let cleaned = response.replace(/SEARCHING\.\.\.|NO DATA|>/g, '').trim();
    
    // Remove header if present (assuming header is always 2 characters)
    const parts = cleaned.split(' ');

    // removing the command from the resonse, example "010C"
    if (parts.length > 3 && parts[0].length === 4) {
      parts.shift();
    }

    // next, removing the header, example "04"
    if (parts.length > 2) {
      parts.shift();
    }
    
    // Join and remove all spaces
    return parts.join('').replace(/ +/g, '');
  }

  private parseMode1Response(response: string) {
    const match = response.match(/^41(\w{2})(.*)/);
    
    if (!match) {
      throw new Error(`Unexpected response format: ${response}`);
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
  
  async queryDTCs(command: '03' | '07' | '0A') {
    try {
      const fragments: string[] = [];
      let responseComplete = false;
  
      const responseHandler = (response: string) => {
        fragments.push(response);
        if (response.includes('>')) {
          responseComplete = true;
        }
      };
  
      this.responseResolver = responseHandler;
  
      await this.sendCommand(command);
  
      // Wait for the complete response
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for complete DTC response'));
        }, 10000); // 10 second timeout, adjust as needed
  
        const checkComplete = () => {
          if (responseComplete) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkComplete, 100);
          }
        };
        checkComplete();
      });
  
      // Clean and process fragments
      const cleanedResponse = this.cleanFragments(fragments, command);
  
      // Interpret the DTC values
      const interpretedValues = this.interpretDTCValues(cleanedResponse, command);
  
      return interpretedValues;
    } catch (error) {
      console.error('Error during DTC query:', error);
      throw error;
    } finally {
      this.responseResolver = null;
    }
  }
  
  private cleanFragments(fragments: string[], mode: '03' | '07' | '0A'): string {
    let modeIdentifier: string;
    switch(mode) {
      case '03': modeIdentifier = '43'; break;
      case '07': modeIdentifier = '47'; break;
      case '0A': modeIdentifier = '4A'; break;
    }
  
    let cleanedResponse = fragments.join('').replace(/[^0-9A-Fa-f]/g, '');

    // removing the command from the response, the first 2 numbers represent the command 03, 07 etc
    cleanedResponse = cleanedResponse.substring(2)

    // breaking the response into 8 bits / 16 characters groups
    const chunks = [];
    for (let i = 0; i < cleanedResponse.length; i += 16) {
      chunks.push(cleanedResponse.substring(i, i + 16));
    }

    cleanedResponse = chunks.map((chunk, i) => {
      if (i === 0) {
        // removing the 1010 string from the first chunk, it's different than the others
        return chunk.substring(4);
      }

      // usually subsequent headers are 21, 22, 23 etc.. only 2 chars
      return chunk.substring(2);
    }).join('');

    const dataStart = cleanedResponse.indexOf(modeIdentifier);

    if (dataStart !== -1) {
      cleanedResponse = cleanedResponse.substring(dataStart);
    }
  
    return cleanedResponse;
  }
  
  private interpretDTCValues = (response: string, mode: '03' | '07' | '0A') => {  
    const interpretedValues: any = [];
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
  
      if (numDTCs === 0) {
        console.log(`No ${dtcType} DTCs found.`);
        return interpretedValues; // Return empty array
      }
  
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
    } else if (response === '000000000000' || response === '0000000000') {
      // mode 0A seems to return a lesser number of bits for empty result vs mode 03 or 07
      console.log(`No ${dtcType} DTCs found.`);
    } else {
      console.error(`Unexpected response format for Mode ${mode}:`, response);
    }
  
    return interpretedValues;
  };
}