import React, { useState } from 'react';
import { View, Button, Alert, Text } from 'react-native';
import { OBDService } from '../services/OBDService';

export const OBDControls: React.FC = () => {
  const [dataToShow, setDataToShow] = useState<any>('');

  const handleMode1 = async () => {
    setDataToShow('');
    try {
      const result = await OBDService.queryPIDs(['0C', '04']);
      setDataToShow(result);
      console.log('Mode 1 result:', result);
    } catch (error) {
      console.error('Error in Mode 1:', error);
    }
  };

  const handleMode9 = async () => {
    setDataToShow('');
    try {
      const mode9Vin = await OBDService.queryMode9(['02']);
      console.log('Mode 9 VIN:', mode9Vin);
      setDataToShow(mode9Vin);
    } catch (error) {
      console.error('Error in Mode 9:', error);
    }
  };

  const handleMode3 = async () => {
    setDataToShow('');
    try {
      const dtcs = await OBDService.queryDTCs('03');
      console.log('Mode 3 DTCs:', dtcs);
      setDataToShow(dtcs);
    } catch (error) {
      console.error('Error in Mode 3:', error);
    }
  };

  const handleMode7 = async () => {
    setDataToShow('');
    try {
      const dtcs = await OBDService.queryDTCs('07');
      console.log('Mode 7 DTCs:', dtcs);
      setDataToShow(dtcs);
    } catch (error) {
      console.error('Error in Mode 7:', error);
    }
  };

  const handleModeA = async () => {
    setDataToShow('');
    try {
      const dtcs = await OBDService.queryDTCs('0A');
      console.log('Mode 0A DTCs:', dtcs);
      setDataToShow(dtcs);
    } catch (error) {
      console.error('Error in Mode 0A:', error);
    }
  };

  const handleClearDTCs = async () => {
    setDataToShow('');
    try {
      const result: any = await OBDService.clearDTCs();
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error clearing DTCs:', error);
    }
  };

  return (
    <View style={{ marginBottom: 70 }}>
      {dataToShow &&
        <View>
          <Text>{JSON.stringify(dataToShow)}</Text>
        </View>
      }
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
  );
};