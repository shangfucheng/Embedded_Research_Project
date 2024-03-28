import React, { useEffect, useState, useRef, useMemo} from 'react';
import {
    BleError,
    BleManager,
    Characteristic,
    Device,
  } from "react-native-ble-plx";
import { PermissionsAndroid, Platform } from 'react-native';
import base64 from "react-native-base64";

interface BluetoothLowEnergyApi {
    requestPermissions(): Promise<boolean>;
    scanForPeripherals(): void;
    connectToDevice: (deviceId: Device) => Promise<void>;
    disconnectFromDevice: () => void;
    connectedDevice: Device | null;
    devices: Device[];
    receivedData: string;
}
const deviceUUID = {
    serviceUUID: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E',
    requestUUID: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E',
    responseUUID: '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',
  };

function BLEDeviceScreen():BluetoothLowEnergyApi {
//   const bleManager = useMemo(() => new BleManager(), []);
  const [bleManager, setBleManager] = useState<BleManager | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [receivedData, setReceivedData] = useState<string>("");
  
  useEffect(() => {
    console.log("init called");
    const manager = new BleManager();
    setBleManager(manager);

    return () => {
      manager.destroy();
    };
  }, []);


const requestAndroid31Permissions = async () => {
  try {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED &&
      bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED &&
      fineLocationPermission === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error('Error requesting Android 31 permissions:', error);
    return false;
  }
};

const requestPermissions = async () => {
  try {
    if (Platform.OS === "android") {
      if (Platform.Version < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted = await requestAndroid31Permissions();
        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};



  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex(device => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>{
    try{
        if(bleManager){
          bleManager.startDeviceScan(null, null, (error, device) => {
              if (error) {
                  console.log(error);
              }
              
              if (device && device.name) {
                  setDevices((prevState: Device[]) => {
                  if (!isDuplicteDevice(prevState, device)) {
                      return [...prevState, device];
                  }
                  return prevState;
                  });
              }
          });
        } else{
            console.log("BLE manager is null");
        }
    }  catch(error){

    }
  }

  const stopScanning = () => {
    try {
        if(bleManager){
            bleManager.stopDeviceScan();
            setDevices([]);
        }
    } catch (error) {
      console.error('stop scanning ', error);
    }
  };

  const connectToDevice = async (device: Device) => {
    try {
        if(bleManager){
            const deviceConnection = await bleManager.connectToDevice(device.id);
            setConnectedDevice(deviceConnection);
            await deviceConnection.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan();
            startStreamingData(deviceConnection);
        }
      } catch (e) {
        console.log("FAILED TO CONNECT", e);
      }
  };

  const disconnectFromDevice = () => {
    if (connectedDevice && bleManager) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setReceivedData("");
    }
  };

  const startStreamingData = async (device: Device) => {
    try {
      device.monitorCharacteristicForService(
        deviceUUID.serviceUUID,
        deviceUUID.responseUUID,
        dataReceivedCallBack,
      );
    } catch (error) {
      console.error('Failed to start streaming data', error);
    }
  };

  const dataReceivedCallBack = (
    error: BleError | null,
    characteristic: Characteristic | null,
  ) => {
    if (error) {
      console.error('Error receiving data:', error);
      setConnectedDevice(null);
      setReceivedData('');
      
      return;
    }

    if (!characteristic?.value) {
      console.log('No data was received');
      return;
    }
    const rawData = base64.decode(characteristic.value);
    
    console.log("raw data: ", rawData);
    setReceivedData(rawData);
  };


  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    devices,
    connectedDevice,
    disconnectFromDevice,
    receivedData,
  };
};

export default BLEDeviceScreen;
