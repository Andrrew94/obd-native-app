import React from 'react';
import { FlatList, Text, TouchableOpacity } from 'react-native';

const DeviceList = ({ devices, connectToDevice }: any) => {
  const renderDevice = ({ item }: any) => (
    <TouchableOpacity onPress={() => connectToDevice(item)}>
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={devices}
      keyExtractor={item => item.id}
      renderItem={renderDevice}
    />
  );
};

export default DeviceList;
