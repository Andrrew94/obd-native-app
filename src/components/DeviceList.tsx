import React from 'react';
import { Text, TouchableOpacity, FlatList } from 'react-native';

interface DeviceListProps {
  devices: any[];
  onConnect: (device: any) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices, onConnect }) => {
  return (
    <FlatList
      style={{ marginTop: 10 }}
      data={devices}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onConnect(item)} style={{ marginTop: 5 }}>
          <Text style={{ fontSize: 16 }}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  );
};