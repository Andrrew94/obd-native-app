import React, { useState, useEffect } from 'react';
import { requestPermissions } from './src/utils/Permissions';
import { BluetoothService } from './src/services/BluetoothService';
import { OBDService } from './src/services/OBDService';
import { DeviceList } from './src/components/DeviceList';
import { OBDControls } from './src/components/OBDControls';
import { View, Text, Button, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import CheckBox from '@react-native-community/checkbox';

const App: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [activeTab, setActiveTab] = useState('liveData');
  const [rpmChecked, setRpmChecked] = useState(false);
  const [speedChecked, setSpeedChecked] = useState(false);
  const [showLiveData, setShowLiveData] = useState(false);
  const [liveData, setLiveData] = useState<any>({ rpm: [], speed: [] });
  const [isLiveDataRunning, setIsLiveDataRunning] = useState(false);

  const handleStartLiveData = async () => {
    setShowLiveData(true);
    setIsLiveDataRunning(true);
    try {
      await OBDService.startLiveData((data) => {
        setLiveData((prevData: any) => ({
          rpm: [...prevData.rpm, data.rpm],
          speed: [...prevData.speed, data.speed]
        }));
      });
    } catch (error) {
      console.error('Failed to start live data:', error);
      setIsLiveDataRunning(false);
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  const handleStartScan = () => {
    BluetoothService.scanForDevices(setDevices);
  };

  const handleConnectToDevice = async (device: any) => {
    setIsConnecting(true);
    try {
      await OBDService.connectAndInitialize(device);
      setIsConnected(true);
      // Alert.alert('Success', 'Connected and initialized successfully');
    } catch (error: any) {
      console.error('Error connecting to device:', error);
      Alert.alert('Error', `Failed to connect: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleReset = async () => {
    try {
      console.log('Resetting connection...');
      await OBDService.disconnect();
      BluetoothService.stopDeviceScan();
      setDevices([]);
      setIsConnected(false);
      setIsConnecting(false);
      console.log('Reset complete');
      Alert.alert('Reset', 'All connections have been reset');
    } catch (error: any) {
      console.error('Error during reset:', error);
      Alert.alert('Error', `Failed to reset: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <View style={{ flex: 1, marginRight: 15 }}>
          <Button
            title="Start Scan" 
            onPress={handleStartScan} 
            disabled={isConnecting || isConnected}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button 
            title="Reset" 
            onPress={handleReset} 
            color="red"
          />
        </View>
      </View>
      {isConnecting && <Text>Connecting...</Text>}
      <DeviceList devices={devices} onConnect={handleConnectToDevice} />
      {isConnected && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'liveData' && styles.activeTab]} 
            onPress={() => setActiveTab('liveData')}
          >
            <Text>Live Data</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'diagnose' && styles.activeTab]} 
            onPress={() => setActiveTab('diagnose')}
          >
            <Text>Diagnose</Text>
          </TouchableOpacity>
        </View>
      )}
      {isConnected && activeTab === 'liveData' && (
        <View style={styles.liveDataContainer}>
          <View style={styles.checkboxContainer}>
            <CheckBox
              value={rpmChecked}
              onValueChange={setRpmChecked}
            />
            <Text>RPM</Text>
          </View>
          <View style={styles.checkboxContainer}>
            <CheckBox
              value={speedChecked}
              onValueChange={setSpeedChecked}
            />
            <Text>Speed</Text>
          </View>
          <Button 
            title="Start Live Data" 
            onPress={handleStartLiveData}
          />
          {showLiveData && (
            <View style={styles.graphContainer}>
              {rpmChecked && (
                <View style={styles.graph}>
                  <Text>RPM Graph</Text>
                  {/* Add your RPM graph component here */}
                </View>
              )}
              {speedChecked && (
                <View style={styles.graph}>
                  <Text>Speed Graph</Text>
                  {/* Add your Speed graph component here */}
                </View>
              )}
            </View>
          )}
        </View>
      )}
      {isConnected && activeTab === 'diagnose' && <OBDControls />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  tab: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  activeTab: {
    backgroundColor: '#ddd',
  },
  liveDataContainer: {
    marginTop: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  graphContainer: {
    marginTop: 20,
  },
  graph: {
    marginBottom: 20,
    // Add more styling for your graphs
  },
});

export default App;