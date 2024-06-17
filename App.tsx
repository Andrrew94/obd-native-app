import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, Alert } from 'react-native';
import { requestPermissions } from './utils/Permissions';
import { scanForDevices, stopDeviceScan, connectToDevice } from './services/BluetoothManager';
import { initializeOBD, querySupportedPIDs } from './services/OBDService';
import DeviceList from './components/DeviceList';

const App = () => {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [pids, setPids] = useState([]);

  useEffect(() => {
    requestPermissions();
  }, []);

  const handleStartScan = () => {
    setDevices([]); // Clear the current device list
    scanForDevices(setDevices);
  };

  const handleReset = () => {
    setDevices([]);
    setConnectedDevice(null);
    setPids([]);
  };

  const handleConnectToDevice = async (device: any) => {
    stopDeviceScan();
    try {
      const connectedDevice = await connectToDevice(device);
      console.log('Connect to device success');
      setConnectedDevice(connectedDevice);
      await initializeOBD(connectedDevice);
      const supportedPIDs: any = await querySupportedPIDs(connectedDevice);
      console.log('Supported pids are', JSON.stringify(supportedPIDs, null, 2));
      setPids(supportedPIDs);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={{ marginTop: 40 }}>
      <View style={{ marginTop: 15 }}>
        <Button title="Start Scanning" onPress={handleStartScan} />
      </View>
      <View style={{ marginTop: 15 }}>
        <Button title="Reset" onPress={handleReset} />
      </View>
      <View style={{ marginTop: 15 }}>
      <Text>Available Devices:</Text>
        <DeviceList devices={devices} connectToDevice={handleConnectToDevice} />
      </View>
      <View style={{ marginTop: 15 }}>
      <Text>Supported PIDs:</Text>
        <FlatList
          data={pids}
          keyExtractor={item => item}
          renderItem={({ item }) => <Text>{item}</Text>}
        />
      </View>
    </View>
  );
};

export default App;
