import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, SectionList } from 'react-native';
import { requestPermissions } from './utils/Permissions';
import { scanForDevices, stopDeviceScan, connectToDevice } from './services/BluetoothManager';
import { initializeOBD, interpretPidValues, queryDTCValues, queryPidValuesMode1 } from './services/OBDService';

const App = () => {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [pids, setPids] = useState<any>([]);
  const [interpretedValues, setInterpretedValues] = useState<any>([]);

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
      console.log('Connect to device success');
      setConnectedDevice(connectedDevice);
      await initializeOBD(connectedDevice);
      // const supportedPIDs: any = await querySupportedPIDs(connectedDevice);
      // console.log('Supported PIDs are', JSON.stringify(supportedPIDs, null, 2));
      // setPids(supportedPIDs);
      setPids(['0C']);

      // const pidValues = await queryPidValues(device, supportedPIDs);
      const pidValues = await queryPidValuesMode1(device, ['0C', '04']);
      const values = interpretPidValues(pidValues);
      setInterpretedValues(values);
      console.log('interpreted values are', JSON.stringify(values, null, 2));

      const mode3DTCs = await queryDTCValues(connectedDevice);
      console.log('mode3DTCs', mode3DTCs);
      

      // const supportedPidsMode9 = await queryMode9SupportedPids(connectedDevice);
      // console.log('supportedPidsMode9', supportedPidsMode9);
      
      // const pidValuesMode9 = await queryPidValuesMode9(device, supportedPidsMode9);
      // console.log('pidValuesMode9', pidValuesMode9);
    } catch (error: any) {
      console.error('Error during BLE operation:', error);
      Alert.alert('Error', `Error during BLE operation: ${error.message}`);
    }
  };

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
      <View style={{ marginTop: 15 }}>
        <Button title="Reset" onPress={handleReset} />
      </View>
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
