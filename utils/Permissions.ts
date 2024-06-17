import { PermissionsAndroid, Platform } from 'react-native';

export const requestPermissions = async () => {
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
