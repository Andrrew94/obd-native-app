import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { Buffer } from 'buffer';
import { MODE_1_PIDS } from '../PIDS/mode-1-pids';
import { MODE_9_PIDS } from '../PIDS/mode-9-pids';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export const findCharacteristicUUIDs = async (device: any) => {
  const services: any = await BleManager.retrieveServices(device.id);
  let writableCharacteristicUUID = null;
  let notifiableCharacteristicUUID = null;
  let serviceUUID = null;

  for (const characteristic of services.characteristics) {
    if (characteristic.properties.Write) {
      writableCharacteristicUUID = characteristic.characteristic;
      serviceUUID = characteristic.service;
    }
    if (characteristic.properties.Notify) {
      notifiableCharacteristicUUID = characteristic.characteristic;
      serviceUUID = characteristic.service;
    }
  }

  if (!writableCharacteristicUUID) {
    throw new Error('Writable characteristic not found');
  }

  return { serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID };
};

export const initializeOBD = async (device: any) => {
  let subscription;
  let serviceUUID;
  let writableCharacteristicUUID;
  let notifiableCharacteristicUUID;
  let responseBuffer = '';
  let responseReceived = false;

  try {
    console.log('Initialize OBD adapter - start');

    const characteristics = await findCharacteristicUUIDs(device);
    serviceUUID = characteristics.serviceUUID;
    writableCharacteristicUUID = characteristics.writableCharacteristicUUID;
    notifiableCharacteristicUUID = characteristics.notifiableCharacteristicUUID;

    if (notifiableCharacteristicUUID) {
      await BleManager.startNotification(device.id, serviceUUID, notifiableCharacteristicUUID);

      subscription = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', ({ value }) => {
        const response = Buffer.from(value).toString('ascii').trim();
        console.log('Received notification:', response);

        // Append to the response buffer
        responseBuffer += response;

        // Check if the response includes the terminator
        if (response.includes('>')) {
          responseReceived = true;
        }
      });

      const commands = [
        { command: 'ATZ', description: 'Reset OBD-II adapter' },
        { command: 'ATSP0', description: 'Set protocol to auto' },
        { command: 'ATE0', description: 'Turn off echo' },
        { command: 'ATL0', description: 'Turn off line feed' },
        { command: 'ATS0', description: 'Turn off spaces' },
        { command: 'ATH0', description: 'Turn off headers' },
        // { command: 'ATDP', description: 'Identify protocol' },
        // { command: 'ATAT1', description: ' The Adaptive Timing is a feature that automatically adjusts the time between the OBD requests and the expected responses based on the performance of the ECU. This helps in optimizing the communication speed.' },
      ];

      for (const { command, description } of commands) {
        // Reset buffer and response flag for each command
        responseBuffer = '';
        responseReceived = false;

        const commandBuffer = Buffer.from(`${command}\r`, 'utf-8').toJSON().data;
        console.log(`Sending command: ${command}`);

        await BleManager.write(device.id, serviceUUID, writableCharacteristicUUID, commandBuffer);

        // Wait for the response
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (!responseReceived) {
              reject(new Error('Response timeout'));
            }
          }, 5000); // 5 seconds timeout for response

          const checkResponse = () => {
            if (responseReceived) {
              clearTimeout(timeout);
              resolve();
            } else {
              setTimeout(checkResponse, 100); // Check again after 100ms
            }
          };
          checkResponse();
        });

        console.log(`Response for ${command}: ${responseBuffer}`);

        // Introduce a delay after sending ATE0 command
        if (command === 'ATE0') {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay to ensure echo is disabled
        }
      }

      console.log('Initialization commands sent with success');
    }
  } catch (error) {
    console.error('Failed to initialize OBD adapter:', error);
  } finally {
    if (subscription) {
      subscription.remove();
      await BleManager.stopNotification(device.id, serviceUUID, notifiableCharacteristicUUID);
      console.log('Unsubscribed from notifications after initialization');
    }
  }
};

export const subscribeToNotifications = (deviceId: any, serviceUUID: any, characteristicUUID: any) => {
  return new Promise((resolve, reject) => {
    bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', ({ value }) => {
      const response = Buffer.from(value).toString('ascii').trim();
      console.log(`Received notification: ${response}`);
      resolve(response);
    });

    BleManager.startNotification(deviceId, serviceUUID, characteristicUUID)
      .then(() => {
        console.log('Notification started');
      })
      .catch((error) => {
        console.error('Failed to start notification:', error);
        reject(error);
      });
  });
};

export const queryPidValuesMode1 = async (device: any, pids: any) => {
  let subscription;
  let responseBuffer = '';
  let responseReceived = false;

  let serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID;

  try {
    ({ serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID } = await findCharacteristicUUIDs(device));

    await BleManager.startNotification(device.id, serviceUUID, notifiableCharacteristicUUID);

    subscription = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', ({ value }) => {
      const response = Buffer.from(value).toString('ascii').trim();
      console.log('Received notification:', response);

      // Append to the response buffer
      responseBuffer += response;

      // Check if the response includes the terminator
      if (response.includes('>')) {
        responseReceived = true;
      }
    });

    const results = [];

    for (const pid of pids) {
      responseBuffer = '';
      responseReceived = false;

      const command = `01${pid}`;
      const commandBuffer = Buffer.from(`${command}\r`, 'utf-8').toJSON().data;
      console.log(`Sending Mode 1 command: ${command}`);

      await BleManager.write(device.id, serviceUUID, writableCharacteristicUUID, commandBuffer);

      // Wait for the response
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!responseReceived) {
            reject(new Error('Response timeout'));
          }
        }, 5000); // 5 seconds timeout for response

        const checkResponse = () => {
          if (responseReceived) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkResponse, 100); // Check again after 100ms
          }
        };
        checkResponse();
      });

      // Filter out irrelevant parts from the response buffer
      const cleanedResponse = cleanResponse(responseBuffer);
      console.log('Cleaned Response', cleanedResponse);

      try {
        const parsedResponse = parseMode1Response(cleanedResponse);
        console.log('Processed response:', parsedResponse);
        results.push(parsedResponse);
      } catch (error) {
        console.error('Failed to parse response:', error);
        console.error('Failed to process response:', cleanedResponse);
      }
    }

    return results;
  } catch (error) {
    console.error('Error during Mode 1 query:', error);
  } finally {
    if (subscription) {
      subscription.remove();
      await BleManager.stopNotification(device.id, serviceUUID, notifiableCharacteristicUUID);
      console.log('Unsubscribed from notifications after Mode 1 queries');
    }
  }
};

const cleanResponse = (response: string): string => {
  // Remove "SEARCHING...", duplicates, and other unexpected parts
  return response.replace(/SEARCHING\.\.\.|NO DATA|>/g, '').replace(/ +/g, '').trim();
};

const parseMode1Response = (response: any) => {
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
};

const interpretMode9Values = (response: string) => {
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

const assembleVIN = (vinParts: any[]) => {
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
  console.log('Final assembled VIN:', fullVin);

  return fullVin;
};

export const queryMode9ForVin = async (device: any) => {
  console.log('=== Starting Mode 9 Query for VIN ===');
  let subscription;
  let responseBuffer: string = '';
  let responseReceived = false;
  let serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID;

  try {
    ({ serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID } = await findCharacteristicUUIDs(device));
    await BleManager.startNotification(device.id, serviceUUID, notifiableCharacteristicUUID);

    subscription = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', ({ value }) => {
      const chunk = Buffer.from(value).toString('ascii');
      console.log(`Received notification:`, chunk);
      responseBuffer += chunk;

      if (chunk.includes('>')) {
        responseReceived = true;
        console.log('Response complete');
      }
    });

    const results = [];
    // const commands = ['0902', '0902 1', '0902 2', '0902 3'];  // Multiple commands to get full VIN
    const commands = ['0902'];  // Multiple commands to get full VIN

    for (const command of commands) {
      responseBuffer = '';
      responseReceived = false;

      const commandBuffer = Buffer.from(`${command}\r`, 'utf-8').toJSON().data;
      console.log('Sending command:', command);
      await BleManager.write(device.id, serviceUUID, writableCharacteristicUUID, commandBuffer);

      // Wait for the response
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (!responseReceived) {
              console.log('Response timeout');
              reject(new Error('Response timeout'));
            }
          }, 10000);  // 10 seconds timeout for response

          const checkResponse = () => {
            if (responseReceived) {
              clearTimeout(timeout);
              resolve();
            } else {
              setTimeout(checkResponse, 100);  // Check again after 100ms
            }
          };
          checkResponse();
        });

        const parsedResponse = interpretMode9Values(responseBuffer);
        results.push(...parsedResponse);
      } catch (error) {
        console.error('Error processing command:', command, error);
      }
    }

    // Assemble the full VIN
    const vinParts = results.filter(r => r.pid === '02');
    if (vinParts.length > 0) {
      const fullVin = assembleVIN(vinParts);
      console.log('Assembled full VIN:', fullVin);
      results.push({
        pid: '02',
        description: 'Vehicle Identification Number (VIN)',
        unit: '',
        data: fullVin
      });
    } else {
      console.log('No VIN parts found to assemble');
    }

    console.log('=== Mode 9 Query VIN Complete ===');
    return results;
  } catch (error) {
    console.error('Error during Mode 9 query:', error);
  } finally {
    if (subscription) {
      subscription.remove();
      await BleManager.stopNotification(device.id, serviceUUID, notifiableCharacteristicUUID);
      console.log('Unsubscribed from notifications after Mode 9 queries');
    }
  }
};

export const queryMode3 = async (device: any) => {
  let subscription;
  let responseBuffer = '';
  let responseReceived = false;

  let serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID;

  try {
    ({ serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID } = await findCharacteristicUUIDs(device));

    await BleManager.startNotification(device.id, serviceUUID, notifiableCharacteristicUUID);

    subscription = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', ({ value }) => {
      const response = Buffer.from(value).toString('ascii');
      console.log('Received notification:', response);

      // Append to the response buffer
      responseBuffer += response;

      // Check if the response is complete (ends with '>')
      if (response.includes('>')) {
        responseReceived = true;
      }
    });

    responseBuffer = '';
    responseReceived = false;

    const command = '03';
    const commandBuffer = Buffer.from(`${command}\r`, 'ascii').toJSON().data;
    console.log(`Sending Mode 3 command: ${command}`);

    await BleManager.write(device.id, serviceUUID, writableCharacteristicUUID, commandBuffer);

    // Wait for the response
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!responseReceived) {
          reject(new Error('Response timeout'));
        }
      }, 5000); // 5 seconds timeout for response

      const checkResponse = () => {
        if (responseReceived) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkResponse, 100); // Check again after 100ms
        }
      };
      checkResponse();
    });

    // Clean the response buffer
    const cleanedResponse = cleanResponseMode3(responseBuffer);
    console.log('Cleaned response:', cleanedResponse);

    // Interpret the DTC values
    const interpretedValues = interpretDTCValues(cleanedResponse);
    console.log('Interpreted DTC values:', interpretedValues);

    return interpretedValues;
  } catch (error) {
    console.error('Error during Mode 3 query:', error);
  } finally {
    if (subscription) {
      subscription.remove();
      await BleManager.stopNotification(device.id, serviceUUID, notifiableCharacteristicUUID);
      console.log('Unsubscribed from notifications after Mode 3 queries');
    }
  }
};

const cleanResponseMode3 = (response: any) => {
  // Remove "SEARCHING..." and other non-data parts
  let cleaned = response.replace(/SEARCHING\.\.\./g, '')
                        .replace(/7F0031/g, '')  // Remove this error code if present
                        .replace(/\d+:\s*/g, '')
                        .replace(/[\r\n>]/g, '')
                        .trim();
  
  // Ensure the response starts with '43'
  const dataStart = cleaned.indexOf('43');
  if (dataStart !== -1) {
    cleaned = cleaned.substring(dataStart);
  }
  
  return cleaned;
};

const interpretDTCValues = (response: any) => {
  const interpretedValues = [];

  if (response.startsWith('43')) {
    const data = response.substring(2);
    const numDTCs = parseInt(data.substring(0, 2), 16);
    console.log(`Number of DTCs: ${numDTCs}`);

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
      console.warn(`Warning: Only ${interpretedValues.length} out of ${numDTCs} DTCs were interpreted. The response may be incomplete.`);
    }
  } else {
    console.error('Unexpected response format for Mode 3:', response);
  }

  return interpretedValues;
};