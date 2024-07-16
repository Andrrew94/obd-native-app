import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, SectionList } from 'react-native';
import { scanForDevices, stopDeviceScan, connectToDevice } from './services/BluetoothManager';
import { clearDTCs, initializeOBD, queryDTC, queryMode9ForVin, queryPidValuesMode1 } from './services/OBDService';
import { requestPermissions } from './utils/Permissions';
import BleManager from 'react-native-ble-manager';

const App = () => {
  const [devices, setDevices] = useState<any>([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [pids, setPids] = useState<any>([]);
  const [interpretedValues, setInterpretedValues] = useState<any>([]);
  const [carVin, setCarVin] = useState<any>('');

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
    } catch (error: any) {
      console.error('Error during BLE operation:', error);
      Alert.alert('Error', `Error during BLE operation: ${error.message}`);
    }
  };

  const handleMode1 = async () => {
    try {
      const pids = ['0C', '04']; // Example PIDs for RPM and Engine Load
      const mode1PidResponse = await queryPidValuesMode1(connectedDevice, pids);
      console.log('mode1PidResponse', mode1PidResponse);
      
    } catch (error: any) {
      console.error('Error during Mode 1 operation:', error);
      Alert.alert('Error', `Error during Mode 1 operation: ${error.message}`);
    }
  };

  // TODO: emulator does not support mode 2
  // const handleMode2 = async () => {
  //   try {
  //     const pids = ['02', '03', '04', '05', '06', '07', '0C', '0D'];
  //     const mode2Response = await queryPidValuesMode2(connectedDevice, pids);
  //     console.log('mode 2 response', mode2Response);
      
  //   } catch (error: any) {
  //     console.error('Error during Mode 1 operation:', error);
  //     Alert.alert('Error', `Error during Mode 1 operation: ${error.message}`);
  //   }
  // };

  const handleMode3 = async () => {
    try {
      const mode3DTCs = await queryDTC(connectedDevice, '03');
      console.log('mode3DTCs', mode3DTCs);
    } catch (error: any) {
      console.error('Error during Mode 3 operation:', error);
      Alert.alert('Error', `Error during Mode 3 operation: ${error.message}`);
    }
  };

  const handleClearDTCs = async () => {
    try {
      const result = await clearDTCs(connectedDevice);
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error in handleClearDTCs:', error);
      Alert.alert('Error', 'Failed to clear DTCs');
    }
  };

  const handleMode7 = async () => {
    try {
      const mode7DTCs = await queryDTC(connectedDevice, '07');
      console.log('mode7DTCs', mode7DTCs);
    } catch (error: any) {
      console.error('Error during Mode 7 operation:', error);
      Alert.alert('Error', `Error during Mode 3 operation: ${error.message}`);
    }
  };
  
  const handleModeA = async () => {
    try {
      const modeADTCs = await queryDTC(connectedDevice, '0A');
      console.log('modeADTCs', modeADTCs);
    } catch (error: any) {
      console.error('Error during Mode 0A operation:', error);
      Alert.alert('Error', `Error during Mode 0A operation: ${error.message}`);
    }
  };

  const handleMode9 = async () => {
    setCarVin('')
    try {
      // BIG TODO: if you query mode 1 or mode 9 consecutively, sometimes the answers are valid and complete, sometimes errors and missing info, we need retry mechanism based on detecting errors 
      // TODO: we need to call 0901 to get the number of chunks needed to retrieve the VIN, that applies for 04 and 06 pids from mode 9 too
      // note for TODO above: discovered that our code is working with only calling 0902, withot the 0902 1, 0902 2 etc.. need to investigate why
      // const queryMode9forVinChunks = await queryVinChunks(connectedDevice, ['01']);
      // console.log('queryMode9forVinChunks', queryMode9forVinChunks);
      
      const carVinArr: any = await queryMode9ForVin(connectedDevice);
      if (carVinArr[carVinArr.length - 1].data.length === 17) {
        setCarVin(carVinArr[carVinArr.length - 1].data);
      } else {
        setCarVin(`Invalid vin detected ${carVinArr[carVinArr.length - 1].data}`);
      }
     
      // console.log('CAR VIN', carVinArr[carVinArr.length - 1]);
    } catch (error: any) {
      console.error('Error during Mode 9 operation:', error);
      Alert.alert('Error', `Error during Mode 9 operation: ${error.message}`);
    }
  };

  const disconnectDevice = async () => {
    try {
      if (connectedDevice) {
        await BleManager.disconnect(connectedDevice.id);
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
    { title: 'Interpreted Values', data: interpretedValues.map((item: any) => `${item.description}: ${item.value} ${item.unit}`) },
  ];

  return (
    <View style={{ flex: 1, marginTop: 40 }}>
      <View style={{ marginTop: 15 }}>
        <Button title="Start Scanning" onPress={handleStartScan} />
      </View>
      <View style={{ marginTop: 15 }}>
          <Button title="Reset" onPress={handleReset} />
      </View>
      {connectedDevice &&
        <View>
        <View style={{ marginTop: 15, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '30%' }}>
              <Button title="Mode 1" onPress={handleMode1}/>
            </View>
            <View style={{ width: '30%' }}>
              <Button title="Mode 3" onPress={handleMode3} />
            </View>
            <View style={{ width: '30%' }}>
              <Button title="Clear DTCs" onPress={handleClearDTCs} />
            </View>
          </View> 
          <View style={{ marginTop: 15, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '30%' }}>
              <Button title="Mode 7" onPress={handleMode7}/>
            </View>
            <View style={{ width: '30%' }}>
              <Button title="Mode A" onPress={handleModeA} />
            </View>
            <View style={{ width: '30%' }}>
              <Button title="GET VIN" onPress={handleMode9} />
            </View>
          </View> 
        </View>
      }
      {carVin && 
        <View style={{ marginTop: 10 }}>
          <Text>Vin number: {carVin}</Text>
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
