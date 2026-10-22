// The geofencing task must be defined before anything else runs, including
// when the OS wakes the app in the background just to deliver a geofence event.
import './src/location/geofence';
import 'expo-router/entry';
