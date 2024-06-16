import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, Platform, PermissionsAndroid, Alert, ActivityIndicator, ToastAndroid } from 'react-native';
import { BleManager, Characteristic } from 'react-native-ble-plx';
import { MODE_1_PIDS } from './PIDS/mode-1-pids';
import { Buffer } from 'buffer';

const manager = new BleManager();

const App = () => {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializingAdapter, setIsInitializingAdapter] = useState(false);
  const [isQueryingPIDS, setIsQueryingPIDS] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [displayData, setDisplayData] = useState<any>([]);
  const [writeCharacteristic, setWriteCharacteristic] = useState(null);
  const [_, setNotifyCharacteristic] = useState(null);
  const [responseBuffer, setResponseBuffer] = useState('');
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted = Object.values(granted).every(status => status === PermissionsAndroid.RESULTS.GRANTED);

        if (allGranted) {
          console.log('All permissions granted');
        } else {
          console.log('One or more permissions denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const scanForDevices = () => {
    setDevices([]);
    setIsScanning(true);
    console.log('Starting scan...');
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Error during scan:', error);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        console.log('Device found:', device);
        setDevices((prevDevices: any) => {
          if (!prevDevices.some((d: any) => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });

    setTimeout(() => {
      setIsScanning(false);
      manager.stopDeviceScan();
    }, 10000);
  };

  const connectToDevice = async (device: any) => {
    setIsConnecting(true);
    try {
      const connectedDevice = await manager.connectToDevice(device.id);
      // ToastAndroid.show(`Connected successfully to ${device.name}`, ToastAndroid.SHORT);
  
      const deviceWithServices = await connectedDevice.discoverAllServicesAndCharacteristics();
      // ToastAndroid.show(`Got services successfully`, ToastAndroid.SHORT);
  
      let writeChar = null;
      let notifyChar: any = null;
  
      const services = await deviceWithServices.services();
  
      for (const service of services) {
        const characteristics = await service.characteristics();
        // ToastAndroid.show(`Got characteristics from the current service`, ToastAndroid.SHORT);
        characteristics.forEach((characteristic) => {
          if (characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse) {
            writeChar = characteristic;
          }
          if (characteristic.isNotifiable) {
            notifyChar = characteristic;
          }
        });
      }
  
      if (!writeChar || !notifyChar) {
        console.error('OBD characteristics not found');
        setIsConnecting(false);
        ToastAndroid.show('OBD characteristics not found', ToastAndroid.SHORT);
        return;
      }
  
      // ToastAndroid.show(`Notify characteristic is: ${notifyChar}`, ToastAndroid.SHORT);
      // ToastAndroid.show(`Subscribing to notifications for characteristic: ${notifyChar.uuid}`, ToastAndroid.SHORT);

      setWriteCharacteristic(writeChar);
      setNotifyCharacteristic(notifyChar);
      setConnectedDevice(deviceWithServices);

      await subscribeToNotifications(notifyChar);
  
      setIsConnecting(false);
      ToastAndroid.show(`Connected successfully to ${device.name}`, ToastAndroid.SHORT);
  
    } catch (error: any) {
      // console.error('Failed to connect:', error);
      setIsConnecting(false);
      Alert.alert('Connection Failed', `Failed to connect with error ${error.message}`);
    }
  };
  
  const subscribeToNotifications = (notifyChar: Characteristic) => {
    return new Promise<void>((resolve, reject) => {
      // ToastAndroid.show(`Started subscribe to notification`, ToastAndroid.SHORT);
      notifyChar.monitor((error: any, characteristic: any) => {
        if (error) {
          // ToastAndroid.show(`Err sub: ${error}`, ToastAndroid.SHORT);
          // console.error('Error subscribing to notifications:', error);
          reject(error);
          return;
        }
  
        const response = characteristic.value ? Buffer.from(characteristic.value, 'base64').toString('utf-8').trim() : '';
        // console.log(`Received notification: ${response}`);
        setResponseBuffer(prev => prev + response);
  
        if (response.endsWith('>')) {
          setWaitingForResponse(false);
        }
      });
      ToastAndroid.show(`Subscribed to notifications successfully`, ToastAndroid.SHORT);
      resolve();
    });
  };

  const initializeObdAdapter = async () => {
    if (!writeCharacteristic) {
      ToastAndroid.show('Failed to initialize the adapter', ToastAndroid.SHORT);
      // console.error('Write characteristic not set');
      return;
    }

    setIsInitializingAdapter(true);

    const initCommands = [
      'ATZ',    // Reset the OBD-II adapter
      'ATE0',   // Turn off echo
      'ATL0',   // Turn off line feed
      'ATS0',   // Turn off spaces
      'ATH0',   // Turn off headers
      'ATSP0',  // Set protocol to auto
    ];

    ToastAndroid.show('Initializing the adapter', ToastAndroid.SHORT);

    try {
      for (const command of initCommands) {
        // ToastAndroid.show(`Sending initialization command: ${command}`, ToastAndroid.SHORT);
        // console.log(`Sending initialization command: ${command}`);
        await sendObdCommand(writeCharacteristic, command);
      }
      ToastAndroid.show('Adapter initialized', ToastAndroid.SHORT);
    } catch (error: any) {
      ToastAndroid.show(`Initialization failed: ${error.message}`, ToastAndroid.SHORT);
      // console.error('Initialization error:', error);
    } finally {
      setIsInitializingAdapter(false);
    }
  };

  const sendObdCommand = (writeChar: Characteristic, command: string) => {
    return new Promise<string>((resolve, reject) => {
      const cmd = Buffer.from(`${command}\r`, 'utf-8');
      ToastAndroid.show(`CMD: ${cmd}`, ToastAndroid.SHORT);
      // console.log(`Sending command: ${command}`);
      setResponseBuffer('');  // Clear the buffer before sending the command
      setWaitingForResponse(true);
  
      writeChar.writeWithResponse(cmd.toString('base64')).then(() => {
        // console.log(`Command sent: ${command}`);
        const timeout = setTimeout(() => {
          if (waitingForResponse) {
            setWaitingForResponse(false);
            // console.error('Response timeout');
            ToastAndroid.show('Response timeout', ToastAndroid.SHORT);
            resolve(responseBuffer);  // Resolve with whatever data was collected
          }
        }, 3000); // 3 seconds timeout for response
  
        const checkResponse = () => {
          if (!waitingForResponse) {
            clearTimeout(timeout);
            ToastAndroid.show(`Response received: ${responseBuffer}`, ToastAndroid.SHORT);
            resolve(responseBuffer);
          } else {
            setTimeout(checkResponse, 100);  // Check again after 100ms
          }
        };
        checkResponse();
      }).catch((error) => {
        // console.error(`Error sending command: ${error.message}`);
        ToastAndroid.show(`Error on obd command ${error.message}`, ToastAndroid.SHORT);
        reject(error);
      });
    });
  };

  const queryMode1 = async () => {
    if (!writeCharacteristic) {
      console.error('Write characteristic not set');
      return;
    }
    setIsQueryingPIDS(true);

    ToastAndroid.show('Scanning for supported PIDs', ToastAndroid.SHORT);
    // console.log('Mode 1 selected. Scanning for supported PIDs...');
    // const { supportedPids, allPidResponses } = await scanForSupportedPids(writeCharacteristic);
    const { supportedPids } = await scanForSupportedPids(writeCharacteristic);
    ToastAndroid.show(`Supported pids success respose`, ToastAndroid.SHORT);
    // console.log('Supported Mode 1 PIDs:', supportedPids);
    // console.log('All Mode 1 PID responses:', allPidResponses);

    const filteredSupportedPids = supportedPids.filter(pid => !['0100', '0120', '0140', '0160', '0180', '01A0'].includes(pid));
    const pidValues = await querySupportedPids(writeCharacteristic, filteredSupportedPids);
    ToastAndroid.show(`PID values success respose`, ToastAndroid.SHORT);
    // console.log('Mode 1 PID Values:', pidValues);

    const interpretedValues = interpretPidValues(pidValues);
    ToastAndroid.show(`Interpreted PID values success respose`, ToastAndroid.SHORT);
    // console.log('Interpreted Mode 1 PID Values:', interpretedValues);

    // Displaying the interpreted values on the UI
    setDisplayData(interpretedValues);
    setIsQueryingPIDS(false);
  };

  const scanForSupportedPids = async (writeChar: any) => {
    const supportedPids = [];
    const allPidResponses = [];
    for (let i = 0; i <= 0x60; i += 0x20) {
      const pid = `01${i.toString(16).padStart(2, '0')}`;
      const response = await sendObdCommand(writeChar, pid);
      if (response) {
        allPidResponses.push({ pid, response });

        const match = response.match(/41[0-9A-F]{2}([0-9A-F]{8})/);
        if (match) {
          const bytes = Buffer.from(match[1], 'hex');
          for (let j = 0; j < 4; j++) {
            const byte = bytes.readUInt8(j);
            for (let k = 0; k < 8; k++) {
              if (byte & (1 << (7 - k))) {
                supportedPids.push(`01${(i + j * 8 + k).toString(16).padStart(2, '0')}`);
              }
            }
          }
        } else {
          ToastAndroid.show(`Unexpected response for PID ${pid}: ${response}`, ToastAndroid.SHORT);
          // console.error(`Unexpected response for PID ${pid}: ${response}`);
        }
      }
    }

    return { supportedPids, allPidResponses };
  };

  const querySupportedPids = async (writeChar: any, pids: any) => {
    const pidValues: any = {};
    for (const pid of pids) {
      const response = await sendObdCommand(writeChar, pid);
      if (response && !response.includes('NODATA')) {
        pidValues[pid] = response;
      }
    }
    return pidValues;
  };

  const interpretPidValues = (pidValues: any) => {
    const interpretedValues = [];
  
    for (const [pid, rawValue] of Object.entries(pidValues) as any) {
      if (rawValue.includes('NODATA')) {
        console.log(`PID: ${pid}, Raw Value: ${rawValue} (No Data)`);
        interpretedValues.push({
          pid: pid,
          description: MODE_1_PIDS[pid.slice(2).toUpperCase()].Description,
          unit: MODE_1_PIDS[pid.slice(2).toUpperCase()].Unit,
          value: null
        });
        continue;
      }
  
      // Correctly clean the value by removing the '41' and PID part from the response
      const cleanedValue = rawValue.slice(4, rawValue.length - 1).trim(); // Removes the first 4 characters and the trailing '>'
  
      // Convert the cleaned value to a list of byte values
      const byteValues = [];
      for (let i = 0; i < cleanedValue.length; i += 2) {
        byteValues.push(parseInt(cleanedValue.slice(i, i + 2), 16));
      }
  
      // Find the PID info from MODE_1_PIDS
      const pidInfo = MODE_1_PIDS[pid.slice(2).toUpperCase()];
      if (pidInfo) {
        // Determine the number of arguments the formula requires
        const formula = pidInfo.Formula;
        const formulaArgs = formula.length;
  
        // Call the formula with the appropriate number of arguments
        const value = formula.apply(null, byteValues.slice(0, formulaArgs));
  
        interpretedValues.push({
          pid: pid,
          description: pidInfo.Description,
          unit: pidInfo.Unit,
          value: value
        });
      } else {
        // Handle case where PID info is not found
        console.warn(`PID info not found for ${pid}`);
      }
    }
  
    return interpretedValues;
  };
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ marginTop: 50 }}>OBD-II BLE Scanner</Text>
      {isScanning && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 15}} />}
      {isInitializingAdapter && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 15}} />}
      {isQueryingPIDS && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 15}} />}
      {!isScanning && <Button title="Scan for Devices" onPress={scanForDevices} />}
      <FlatList
        data={devices}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => connectToDevice(item)}>
            <View style={{ padding: 10 }}>
              <Text>{item.name || 'Unnamed device'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      {isConnecting && <ActivityIndicator size="large" color="#0000ff" />}
      {connectedDevice && (
        <View>
          <Button title="Initialize Adapter" onPress={initializeObdAdapter} />
          <Button title="Query Mode 1" onPress={queryMode1} />
        </View>
      )}
      <FlatList
        data={displayData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 10 }}>
            <Text>{item.description || 'Unknown PID'}</Text>
            <Text>{item.value || 'No Data'} {item.unit || ''}</Text>
          </View>
        )}
      />
    </View>
  );
}
  
  export default App;
  