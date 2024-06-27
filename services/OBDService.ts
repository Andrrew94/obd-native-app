import { Device } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { MODE_1_PIDS } from '../PIDS/mode-1-pids';

let responseBuffer = '';
let waitingForResponse = false;
let subscription: any;
let isMonitoring = false;
let operationInProgress = false;

// const writeCommand = async (device: Device, serviceUUID: string, characteristicUUID: string, command: string) => {
//   return new Promise((resolve, reject) => {
//     const cmd = Buffer.from(`${command}\r`, 'utf-8');
//     console.log(`Sending command: ${command}`);
//     responseBuffer = '';  // Clear the buffer before sending the command
//     waitingForResponse = true;

//     device.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, cmd.toString('base64'))
//       .then(() => {
//         const timeout = setTimeout(() => {
//           if (waitingForResponse) {
//             waitingForResponse = false;
//             console.error('Response timeout');
//             resolve(responseBuffer);  // Resolve with whatever data was collected
//           }
//         }, 5000); // 5 seconds timeout for response

//         const checkResponse = () => {
//           if (!waitingForResponse) {
//             clearTimeout(timeout);
//             resolve(responseBuffer);
//           } else {
//             setTimeout(checkResponse, 100);  // Check again after 100ms
//           }
//         };
//         checkResponse();
//       })
//       .catch((error) => {
//         console.error(`Failed to write command ${command}:`, error);
//         reject(error);
//       });
//   });
// };

// const subscribeToNotifications = async (device: Device, serviceUUID: string, characteristicUUID: string) => {
//   return new Promise<void>((resolve, reject) => {
//     device.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
//       if (error) {
//         console.error(`Failed to monitor characteristic: ${error}`);
//         reject(error);
//         return;
//       }

//       const value = characteristic?.value;
//       if (value) {
//         const response = decodeBase64(value).trim();
//         console.log(`Received notification: ${response}`);
//         responseBuffer += response;
//         if (response.endsWith('>')) {
//           waitingForResponse = false;
//         }
//       }
//     });

//     resolve();
//   });
// };

const writeCommand = async (device: Device, serviceUUID: string, writableCharacteristicUUID: string, command: string) => {
    return new Promise((resolve, reject) => {
      operationInProgress = true;
      const cmd = Buffer.from(`${command}\r`, 'utf-8');
      console.log(`Sending command: ${command}`);
      responseBuffer = '';  // Clear the buffer before sending the command
  
      device.writeCharacteristicWithResponseForService(serviceUUID, writableCharacteristicUUID, cmd.toString('base64'))
        .then(() => {
          console.log(`Command ${command} written successfully`);
  
          const timeout = setTimeout(() => {
            console.error(`Response timeout for command: ${command}`);
            operationInProgress = false;
            resolve(responseBuffer);  // Resolve with whatever data was collected
          }, 5000); // 5 seconds timeout for response
  
          const checkResponse = () => {
            if (responseBuffer.endsWith('>')) {
              clearTimeout(timeout);
              operationInProgress = false;
              resolve(responseBuffer);
            } else {
              setTimeout(checkResponse, 100);  // Check again after 100ms
            }
          };
          checkResponse();
        })
        .catch((error) => {
          console.error(`Failed to write command ${command}:`, error);
          operationInProgress = false;
          reject(error);
        });
    });
  };

  const startMonitoring = (device: any, serviceUUID: any, notifiableCharacteristicUUID: any) => {
      return new Promise<void>((resolve, reject) => {
        console.log(`Subscribing to notifications for ${notifiableCharacteristicUUID}`);
        subscription = device.monitorCharacteristicForService(serviceUUID, notifiableCharacteristicUUID, (error: any, characteristic: any) => {
          if (error) {
            console.error('Failed to monitor characteristic:', error);
            reject(error);
            return;
          }
    
          const value = characteristic?.value;
          if (value) {
            const response = decodeBase64(value).trim();
            console.log(`Received notification: ${response}`);
            responseBuffer += response;
          }
        });
        isMonitoring = true;
        resolve();
        console.log('Subscription initialized');
      });
    };
    
    const stopMonitoring = async () => {
      // Wait until no operation is in progress
      while (operationInProgress) {
        console.log('Waiting for current operation to complete...');
        await delay(100);
      }
      
      if (subscription) {
        try {
          console.log('Attempting to remove subscription...');
          subscription.remove();
          subscription = null;
          isMonitoring = false;
          console.log('Subscription removed successfully');
        } catch (err) {
          console.error('Failed to remove subscription:', err);
        }
      }
    };

const subscribeToNotifications = async (device: Device, serviceUUID: string, characteristicUUID: string) => {
    return new Promise<void>((resolve, reject) => {
      console.log(`Subscribing to notifications for ${characteristicUUID}`);
      const subscription = device.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
        if (error) {
          console.error(`Failed to monitor characteristic: ${error}`);
          reject(error);
          return;
        }
  
        console.log('Characteristic subscription successful:', characteristic);
        
        const value = characteristic?.value;
        if (value) {
          const response = decodeBase64(value).trim();
          console.log(`Received notification: ${response}`);
          responseBuffer += response;
          if (response.endsWith('>')) {
            subscription.remove();
            resolve();
          }
        }
      });
      console.log('Subscription initialized');
      resolve();
    });
  };


const decodeBase64 = (base64String: string): string => {
  return Buffer.from(base64String, 'base64').toString('utf-8');
};

const parseSupportedPIDs = (response: string): string[] => {
  console.log('Raw response:', response); // Debug log for raw response
  const pids: string[] = [];
  const hexString = response.replace(/[^0-9A-F]/gi, ''); // Remove any non-hex characters
  console.log('Hex string:', hexString); // Log the cleaned-up hex string

  if (hexString.length < 8) return []; // If response is too short, skip parsing

  for (let i = 0; i < hexString.length; i += 2) {
    const byte = parseInt(hexString.slice(i, i + 2), 16);
    for (let bit = 0; bit < 8; bit++) {
      if (byte & (1 << (7 - bit))) {
        const pid = (i * 4 + bit + 1).toString(16).toUpperCase().padStart(2, '0');
        pids.push(pid);
      }
    }
  }
  return pids;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const findCharacteristicUUIDs = async (device: Device) => {
  const services = await device.services();

  for (const service of services) {
    const characteristics = await device.characteristicsForService(service.uuid);
    let writableCharacteristicUUID = '';
    let notifiableCharacteristicUUID = '';
    let readableCharacteristicUUID = '';

    characteristics.forEach((characteristic) => {
      // if (characteristic.isWritableWithResponse) {
      if (characteristic.isWritableWithResponse) {
        writableCharacteristicUUID = characteristic.uuid;
      }
      if (characteristic.isNotifiable) {
        notifiableCharacteristicUUID = characteristic.uuid;
      }
      if (characteristic.isReadable) {
        readableCharacteristicUUID = characteristic.uuid;
      }
    });

    if (writableCharacteristicUUID && notifiableCharacteristicUUID && readableCharacteristicUUID) {
      console.log(`Service UUID: ${service.uuid}`);
      console.log(`Writable Characteristic UUID: ${writableCharacteristicUUID}`);
      console.log(`Notifiable Characteristic UUID: ${notifiableCharacteristicUUID}`);
      console.log(`Readable Characteristic UUID: ${readableCharacteristicUUID}`);
      return { serviceUUID: service.uuid, writableCharacteristicUUID, notifiableCharacteristicUUID, readableCharacteristicUUID };
    }
  }
  throw new Error('Suitable characteristics not found');  
};

const cleanResponse = (response: string): string => {
  // Remove "SEARCHING..." and other unexpected parts
  return response.replace(/SEARCHING\.\.\.|NO DATA|>/g, '').trim();
};

// export const initializeOBD = async (device: Device) => {
//   try {
//     console.log('Initialize OBD adapter');
//     const { serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID } = await findCharacteristicUUIDs(device);

//     await subscribeToNotifications(device, serviceUUID, notifiableCharacteristicUUID);

//     const initCommands = [
//       'ATZ',    // Reset the OBD-II adapter
//       'ATE0',   // Turn off echo
//       'ATL0',   // Turn off line feed
//       'ATS0',   // Turn off spaces
//       'ATH0',   // Turn off headers
//       'ATSP0',  // Set protocol to auto
//       // 'AT DP', // identify the current protocol, for now i only got the "AUTO" response
//       // 'AT SH 7E0' // Set header to listen only to the engine ECU
//     ];

//     for (const command of initCommands) {
//       await writeCommand(device, serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID, command);
//       await delay(500); // Increase delay to ensure the device processes the command
//     }

//     console.log('Initialization commands sent with success');
//   } catch (error) {
//     console.error('Failed to initialize OBD adapter:', error);
//     throw error;
//   }
// };

export const initializeOBD = async (device: any) => {
  try {
    console.log('Initialize OBD adapter');
    const { serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID } = await findCharacteristicUUIDs(device);

    console.log(`Service UUID: ${serviceUUID}`);
    console.log(`Writable Characteristic UUID: ${writableCharacteristicUUID}`);
    console.log(`Notifiable Characteristic UUID: ${notifiableCharacteristicUUID}`);

    if (!isMonitoring) {
      await startMonitoring(device, serviceUUID, notifiableCharacteristicUUID);
    }

    const initCommands = [
      'ATZ',    // Reset the OBD-II adapter
      'ATE0',   // Turn off echo
      'ATL0',   // Turn off line feed
      'ATS0',   // Turn off spaces
      'ATH0',   // Turn off headers
      'ATSP0',  // Set protocol to auto
      // 'AT DP', // identify the current protocol, for now I only got the "AUTO" response
      // 'AT SH 7E0' // Set header to listen only to the engine ECU
    ];

    for (const command of initCommands) {
      const response = await writeCommand(device, serviceUUID, writableCharacteristicUUID, command);
      console.log(`Response for ${command}: ${response}`);
      await delay(500); // Increase delay to ensure the device processes the command
    }

    console.log('Initialization commands sent with success');
  } catch (error) {
    console.error('Failed to initialize OBD adapter:', error);
    throw error;
  }
};

export const querySupportedPIDs = async (device: Device) => {
  try {
    const { serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID } = await findCharacteristicUUIDs(device);
    const pids = ['0100', '0120', '0140', '0160', '0180', '01A0'];

    let supportedPIDs: string[] = [];

    for (const pid of pids) {
      const response: any = await writeCommand(device, serviceUUID, writableCharacteristicUUID, pid);
      const cleanedResponse = cleanResponse(response);
      console.log(`Cleaned response for PID ${pid}:`, cleanedResponse); // Debug log for cleaned response
      const parsedPIDs = parseSupportedPIDs(cleanedResponse);
      supportedPIDs = [...supportedPIDs, ...parsedPIDs];
    }

    return Array.from(new Set(supportedPIDs)); // Remove duplicates
  } catch (error) {
    console.error('Failed to query supported PIDs:', error);
    throw error;
  }
};

export const queryPidValuesMode1 = async (device: Device, supportedPIDs: string[]) => {
  try {
    const { serviceUUID, writableCharacteristicUUID } = await findCharacteristicUUIDs(device);
    const pidValues: Record<string, string> = {};

    for (const pid of supportedPIDs) {
      // todo: clean this up, make a specific function that calls mode 1 adapter
      const response: any = await writeCommand(device, serviceUUID, writableCharacteristicUUID, `01${pid}`);
      console.log('response from write command', response);
      
      const cleanedResponse = cleanResponse(response);
      console.log(`Cleaned response for PID ${pid}:`, cleanedResponse); // Debug log for cleaned response
      pidValues[pid] = cleanedResponse;
    }

    return pidValues;
  } catch (error) {
    console.error('Failed to query PID values:', error);
    throw error;
  }
};

export const queryPidValuesMode9 = async (device: Device, supportedPIDs: string[]) => {
  try {
    const { serviceUUID, writableCharacteristicUUID } = await findCharacteristicUUIDs(device);
    const pidValues: Record<string, string> = {};

    for (const pid of supportedPIDs) {
      // todo: clean this up, make a specific function that calls mode 1 adapter
      const response: any = await writeCommand(device, serviceUUID, writableCharacteristicUUID, `09${pid}`);
      console.log('response from write command', response);
      
      const cleanedResponse = cleanResponse(response);
      console.log(`Cleaned response for PID ${pid}:`, cleanedResponse); // Debug log for cleaned response
      pidValues[pid] = cleanedResponse;
    }

    return pidValues;
  } catch (error) {
    console.error('Failed to query PID values:', error);
    throw error;
  }
};

export const queryMode9SupportedPids = async (device: Device) => {
  try {
    const { serviceUUID, writableCharacteristicUUID } = await findCharacteristicUUIDs(device);
    const response: any = await writeCommand(device, serviceUUID, writableCharacteristicUUID, '0900');
    const supportedPids = [];

    if (response) {
      const match = response.match(/49[0-9A-F]{2}([0-9A-F]{8})/);
      if (match) {
        const bytes = Buffer.from(match[1], 'hex');
        for (let j = 0; j < 4; j++) {
          const byte = bytes.readUInt8(j);
          for (let k = 0; k < 8; k++) {
            if (byte & (1 << (7 - k))) {
              supportedPids.push(`${(j * 8 + k).toString(16).padStart(2, '0')}`);
            }
          }
        }
      }
    }
  
    return supportedPids;
    
  } catch (error) {
    console.error('Failed to query MODE 9 with error:', error);
    throw error;
  }
};

export const interpretPidValues = (pidValues: { [pid: string]: string }) => {
  const interpretedValues = [];

  for (const [pid, rawValue] of Object.entries(pidValues)) {
    console.log('pid values are', pidValues);
    
    const pidInfo = MODE_1_PIDS[pid.toUpperCase()];
    
    if (!pidInfo) {
      console.warn(`PID info not found for ${pid}`);
      continue;
    }

    if (rawValue.includes('NODATA')) {
      console.log(`PID: ${pid}, Raw Value: ${rawValue} (No Data)`);
      interpretedValues.push({
        pid: pid,
        description: pidInfo.Description,
        unit: pidInfo.Unit,
        value: null
      });
      continue;
    }

    console.log('pidValues inside interpret Pid Values', pidValues);
    
    // Remove '41' and PID part from the response, keep only data part
    const cleanedValue = rawValue.replace(/[\s>]/g, '').substring(4);

    console.log('CLEANING RAW VALUE', cleanedValue);
    
    const byteValues = [];
    for (let i = 0; i < cleanedValue.length; i += 2) {
      byteValues.push(parseInt(cleanedValue.substring(i, i + 2), 16));
    }

    console.log(`PID: ${pid}, Raw Value: ${rawValue}, Cleaned Value: ${cleanedValue}, Byte Values: ${byteValues.join(',')}`);

    try {
      const formula = pidInfo.Formula;
      const formulaArgs = formula.length;
      const value = formula.apply(null, byteValues.slice(0, formulaArgs));

      interpretedValues.push({
        pid: pid,
        description: pidInfo.Description,
        unit: pidInfo.Unit,
        value: value
      });
    } catch (error) {
      console.error(`Error interpreting PID ${pid}:`, error);
    }
  }

  return interpretedValues;
}

// export const queryDTCValues = async (device: Device) => {
//   const { serviceUUID, writableCharacteristicUUID, readableCharacteristicUUID } = await findCharacteristicUUIDs(device);
//   const cmd = Buffer.from(`${'03'}\r`, 'utf-8');

//   try {
//     await device.writeCharacteristicWithResponseForService(
//       serviceUUID,
//       writableCharacteristicUUID,
//       cmd.toString('base64')
//     );

//     const characteristic: any = await device.readCharacteristicForService(
//       serviceUUID,
//       readableCharacteristicUUID
//     );

//     const decodedValue = Buffer.from(characteristic.value, 'base64').toString('hex');
//     console.log('Decoded read value:', decodedValue);
//     console.log('readCharacteristicForService response', characteristic);
//   } catch (error: any) {
//     console.log('Error is', error.message);
//   }

export const queryDTCValues = async (device: Device) => {
  const { serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID } = await findCharacteristicUUIDs(device);
  responseBuffer = '';
  waitingForResponse = true;

  try {
    await writeCommand(device, serviceUUID, writableCharacteristicUUID, '03');

    // Wait until the response ends with '>'
    while (waitingForResponse) {
      await delay(100);
    }

    console.log('Full response received:', responseBuffer);
    // Parse the full response here
  } catch (error: any) {
    console.log('Error querying DTC values:', error.message);
  }
};

  // try {
    // const { serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID } = await findCharacteristicUUIDs(device);
    
  //   // Unsubscribe from any existing notifications
  //   await device.cancelConnection();
  //   await device.connect();
  //   await device.discoverAllServicesAndCharacteristics();

  //   await writeCommandForMode3(device, serviceUUID, writableCharacteristicUUID, '03'); // Mode 3 for retrieving DTCs
  //   const response = await subscribeToNotificationsForMode3(device, serviceUUID, notifiableCharacteristicUUID);
  //   const cleanedResponse = cleanResponseForMode3(response);
  //   console.log(`Cleaned response for Mode 3:`, cleanedResponse); // Debug log for cleaned response

  //   return interpretDTCValues(cleanedResponse);
  // } catch (error) {
  //   console.error('Failed to query DTC values:', error);
  //   throw error;
  // }
// };

export const interpretDTCValues = (response: string) => {
  const interpretedValues = [];

  if (response.startsWith('43')) {
    const cleanedResponse = response.replace(/[\s>]/g, '').substring(2); // Remove '43' and clean the response

    for (let i = 0; i < cleanedResponse.length; i += 4) {
      const dtc = cleanedResponse.substring(i, i + 4);
      if (dtc.length === 4) {
        const system = dtc[0];
        const faultCode = dtc.slice(1);

        let systemCode;
        switch (system) {
          case '0': case '1': systemCode = 'P'; break; // Powertrain
          case '2': case '3': systemCode = 'C'; break; // Chassis
          case '4': case '5': systemCode = 'B'; break; // Body
          case '6': case '7': systemCode = 'U'; break; // Network
          default: systemCode = ''; break;
        }

        const fullDTC = `${systemCode}${faultCode}`;
        interpretedValues.push(fullDTC);
      }
    }
  } else {
    console.error('Unexpected response for Mode 3:', response);
  }

  return interpretedValues;
};

const cleanResponseForMode3 = (response: string): string => {
  // Remove "SEARCHING...", duplicates, and other unexpected parts
  return response.replace(/SEARCHING\.\.\.|NO DATA|>/g, '').replace(/ +/g, '').trim();
};

const subscribeToNotificationsForMode3 = async (device: Device, serviceUUID: string, characteristicUUID: string) => {
  return new Promise<string>((resolve, reject) => {
    let fullResponse = '';

    device.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
      if (error) {
        console.error(`Failed to monitor characteristic: ${error}`);
        reject(error);
        return;
      }

      const value = characteristic?.value;
      if (value) {
        const response = decodeBase64(value).trim();
        console.log(`Received notification: ${response}`);
        fullResponse += response;
        if (fullResponse.includes('>')) {
          waitingForResponse = false;
          resolve(fullResponse);
        }
      }
    });
  });
};

const writeCommandForMode3 = async (device: Device, serviceUUID: string, characteristicUUID: string, command: string) => {
  return new Promise<void>((resolve, reject) => {
    const cmd = Buffer.from(`${command}\r`, 'utf-8');
    console.log(`Sending command: ${command}`);
    responseBuffer = '';  // Clear the buffer before sending the command
    waitingForResponse = true;

    device.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, cmd.toString('base64'))
      .then(() => resolve())
      .catch((error) => {
        console.error(`Failed to write command ${command}:`, error);
        reject(error);
      });
  });
}