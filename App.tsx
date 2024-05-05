import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DeviceModal from "./deviceModal";
import BLEDeviceScreen from "./BLEScreen";
import LiveLineChart from "./LineChart";
import SaveFiles from "./SaveFiles";

// Define a type for the array of 8 floating-point numbers
type InsoleDataType = [number, number, number, number, number, number, number, number];
// type InsoleDataType = [number, number, number, number];

const App = () => {
  const {
    requestPermissions,
    scanForPeripherals,
    devices,
    connectToDevice,
    connectedDevice,
    receivedData,
    disconnectFromDevice,
  } = BLEDeviceScreen();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [phData, setPhData] = useState<number[]>([]);
  const [co2Data, setCo2Data] = useState<number[]>([]);
  const [insoleData, setInsoleData] = useState<InsoleDataType>();
  const [readData, setReadData] = useState<String[]> ([]);
  
  useEffect(() => {
    setReadData(prevData => [...prevData, receivedData]);
    const insole = receivedData +  "10, aY: 11, aZ: 12, s1: 101, s2: 21";
    const phRegex = /pH: (\d+(\.\d+)?)/;
    const co2Regex = /CO2: (\d+(\.\d+)?)/;
    const insoleRegex = /insole: (-?\d+(\.\d+)?), (-?\d+(\.\d+)?), (-?\d+(\.\d+)?), (-?\d+(\.\d+)?), (-?\d+(\.\d+)?), (-?\d+(\.\d+)?), (-?\d+(\.\d+)?)/;

    const phMatch = receivedData.match(phRegex);
    const co2Match = receivedData.match(co2Regex);
    const insoleMatch = receivedData.match(insole);

    if (phMatch) {
      const phValue = parseFloat(phMatch[1]); // Convert the matched number to a float
      setPhData(prevData => [...prevData, phValue]); // Add the parsed number to phData array
    } else if (co2Match){
      const co2Value = parseFloat(co2Match[1]); // Convert the matched number to a float
      setCo2Data(prevData => [...prevData, co2Value]); // Add the parsed number to co2Data array
    } else if (insoleMatch){
      // Split the string by commas and convert each substring to a number
      const iData: InsoleDataType = [
        parseFloat(insoleMatch[1]),
        parseFloat(insoleMatch[3]),
        parseFloat(insoleMatch[5]),
        parseFloat(insoleMatch[7]),
        parseFloat(insoleMatch[9]),
        parseFloat(insoleMatch[11]),
        parseFloat(insoleMatch[13]),
        parseFloat(insoleMatch[15]),
      ];
      setInsoleData(iData);
    }
  }, [receivedData]); // Dependency array to re-run the effect when data changes

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
    scanForPeripherals();
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const openModal = async () => {
    scanForDevices();
    setIsModalVisible(true);
  };
  
  const clearDataCallback = () => {
    setPhData([]);
  }

  const defaultData: InsoleDataType = [10, 20, 30, 40, 50, 60, 70, 80];
  
  return (
    <SafeAreaView style={styles.container}>
      {receivedData ? <LiveLineChart phData={phData} insoleData={insoleData? insoleData: defaultData}/>: null}
      <View style={styles.TitleWrapper}>
        {connectedDevice ? (
          <View style={styles.columnWrapper}>
            <View style={styles.column}>
              <Text style={styles.item}>
                    ${receivedData}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.TitleText}>
            Please Connect to a BLE device
          </Text>
        )}
      </View>

      {connectedDevice? <SaveFiles data={readData}/>: null}
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <TouchableOpacity
          onPress={clearDataCallback}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>
            Clear Data
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={connectedDevice ? disconnectFromDevice : openModal}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>
            {connectedDevice ? "Disconnect" : "Connect"}
          </Text>
        </TouchableOpacity>
      </View>

      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={devices}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  TitleWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  TitleText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 20,
    color: "black",
  },
  ctaButton: {
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    width: "45%",
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  columnWrapper: {
    flexDirection: 'row', // Ensures the inner view (column) wraps correctly
    alignItems: 'center', // Aligns items vertically within the wrapper
  },
  column: {
    flex: 1, // Allows the inner view to take up available space
  },
  item: {
    fontSize: 16,
    color: 'black',
    backgroundColor: "lightblue",
    // Set flexWrap and any other desired text styles
    flexWrap: 'wrap', // Allows text to wrap to the next line when needed
  },
  // item: {
  //   backgroundColor: "lightblue",
  //   padding: 20,
  //   marginVertical: 8,
  //   marginHorizontal: 16,
  //   color:"black",
  // },
  chart: {
    width: '20%', // Adjust width as needed
    height: 200, // Adjust height as needed
  },
});

export default App;