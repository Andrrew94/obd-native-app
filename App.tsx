import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, SectionList } from 'react-native';
import { requestPermissions } from './utils/Permissions';
import { scanForDevices, stopDeviceScan, connectToDevice } from './services/BluetoothManager';
import { findCharacteristicUUIDs, initializeOBD, interpretPidValues, queryDTCValues, queryPidValuesMode1 } from './services/OBDService';

const App = () => {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [pids, setPids] = useState<any>([]);
  const [interpretedValues, setInterpretedValues] = useState<any>([]);
  const [ecuHeaders, setEcuHeaders] = useState<any>([]);

  useEffect(() => {
    requestPermissions();
  }, []);

  const handleStartScan = () => {
    setDevices([]); // Clear the current device list
    scanForDevices(setDevices);
  };

  const handleReset = async () => {
    if (connectedDevice) {
      await disconnectDevice();
    }
    setDevices([]);
    setConnectedDevice(null);
    setPids([]);
    setInterpretedValues([]);
  };

  const handleConnectToDevice = async (device: any) => {
    stopDeviceScan();
    try {
      const connectedDevice = await connectToDevice(device);
      await initializeOBD(connectedDevice);
      setConnectedDevice(connectedDevice);
      console.log('Connect to device success');
      // const supportedPIDs: any = await querySupportedPIDs(connectedDevice);
      // console.log('Supported PIDs are', JSON.stringify(supportedPIDs, null, 2));
      // setPids(supportedPIDs);
      // setPids(['0C']);

      // // const pidValues = await queryPidValues(device, supportedPIDs);
      // const pidValues = await queryPidValuesMode1(device, ['0C', '04']);
      // const values = interpretPidValues(pidValues);
      // setInterpretedValues(values);
      // console.log('interpreted values are', JSON.stringify(values, null, 2));

      // const mode3DTCs = await queryDTCValues(connectedDevice);
      // console.log('mode3DTCs', mode3DTCs);
      

      // const supportedPidsMode9 = await queryMode9SupportedPids(connectedDevice);
      // console.log('supportedPidsMode9', supportedPidsMode9);
      
      // const pidValuesMode9 = await queryPidValuesMode9(device, supportedPidsMode9);
      // console.log('pidValuesMode9', pidValuesMode9);
    } catch (error: any) {
      console.error('Error during BLE operation:', error);
      Alert.alert('Error', `Error during BLE operation: ${error.message}`);
    }
  };

  const handleMode1 = async () => {
    try {
    // const supportedPIDs: any = await querySupportedPIDs(connectedDevice);
    // console.log('Supported PIDs are', JSON.stringify(supportedPIDs, null, 2));
    // setPids(supportedPIDs);
    setPids(['0C', '04']);

    // const pidValues = await queryPidValues(device, supportedPIDs);
    const pidValues = await queryPidValuesMode1(connectedDevice, ['0C', '04']);
    const values = interpretPidValues(pidValues);
    setInterpretedValues(values);
    console.log('interpreted values are', JSON.stringify(values, null, 2));
    } catch(error: any) {
      console.error('Error during Mode 1 operation:', error);
      Alert.alert('Error', `Error during Mode 1 operation: ${error.message}`);
    }
  }

  const handleMode3 = async () => {
    const mode3DTCs = await queryDTCValues(connectedDevice);
    // console.log('mode3DTCs', mode3DTCs);
  }

  const handleMode9 = async () => {
    console.log('calling mode 9');
    
  }

  const disconnectDevice = async () => {
    try {
      if (connectedDevice) {
        await connectedDevice.cancelConnection();
        console.log('Disconnected from device');
      }
    } catch (error: any) {
      console.error('Error disconnecting from device:', error);
      Alert.alert('Error', `Error disconnecting from device: ${error.message}`);
    }
  };

  const identifyEcuHeader = (response: any) => {
    const header: any = response.substring(0, 3);
    if (!ecuHeaders.includes(header)) {
      setEcuHeaders((prevHeaders: any) => [...prevHeaders, header]);
    }
  };

  const writeCommandTest = async (device: any, serviceUUID: any, characteristicUUID: any, command: any) => {
    const cmd = Buffer.from(`${command}\r`, 'utf-8').toString('base64');
    await device.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, cmd);
  };

  const discoverECUs = async () => {
    if (!connectedDevice) return;

    const { serviceUUID, writableCharacteristicUUID, notifiableCharacteristicUUID } = await findCharacteristicUUIDs(connectedDevice);
    const broadcastAddress = '7DF'; // Broadcast to all ECUs

    // Send broadcast request to discover ECUs
    await writeCommandTest(connectedDevice, serviceUUID, writableCharacteristicUUID, `AT SH ${broadcastAddress}`);
    await writeCommandTest(connectedDevice, serviceUUID, writableCharacteristicUUID, '01 00');

    // Wait for the responses
    connectedDevice.monitorCharacteristicForService(serviceUUID, writableCharacteristicUUID, (error: any, characteristic: any) => {
      if (error) {
        console.error('Monitor error', error);
        return;
      }

      if (characteristic.value) {
        const response = Buffer.from(characteristic.value, 'base64').toString('ascii').trim();
        console.log('Response:', response);
        identifyEcuHeader(response);
      }
    });
  };

  const sections = [
    { title: 'Available Devices', data: devices },
    { title: 'Supported PIDs', data: pids },
    { title: 'Interpreted Values', data: interpretedValues.map((item: any) => `${item.description}: ${item.value} ${item.unit}`) }
  ];

  return (
    <View style={{ flex: 1, marginTop: 40 }}>
      <View style={{ marginTop: 15 }}>
        <Button title="Start Scanning" onPress={handleStartScan} />
      </View>
      {connectedDevice &&
        <View>
          <View style={{ marginTop: 15 }}>
          <Button title="Reset" onPress={handleReset} />
        </View>
        <View style={{ marginTop: 15, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '30%' }}>
            <Button title="Mode 1" onPress={handleMode1}/>
          </View>
          <View style={{ width: '30%' }}>
            <Button title="Mode 3" onPress={handleMode3} />
          </View>
          <View style={{ width: '30%' }}>
            <Button title="Mode 9" onPress={handleMode9} />
          </View>
        </View>
        <View>
            <Text>Discovered ECU Headers:</Text>
            {ecuHeaders.map((header: any, index: any) => (
              <Text key={index}>{header}</Text>
            ))}
            <Button title="Discover ECUs" onPress={discoverECUs} />
          </View>
      </View>
      }
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item + index}
        renderItem={({ item, section }: any) => {
          if (section.title === 'Available Devices') {
            return (
              <Text onPress={() => handleConnectToDevice(item)}>
                {item.name}
              </Text>
            );
          } else {
            return <Text>{item}</Text>;
          }
        }}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginTop: 15 }}>{title}</Text>
        )}
      />
    </View>
  );
};

export default App;
