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
  
  useEffect(() => {
    const phRegex = /pH: (\d+(\.\d+)?)/;
    const co2Regex = /CO2: (\d+(\.\d+)?)/;
    const phMatch = receivedData.match(phRegex);
    const co2Match = receivedData.match(co2Regex);
    if (phMatch) {
      const phValue = parseFloat(phMatch[1]); // Convert the matched number to a float
      setPhData(prevData => [...prevData, phValue]); // Add the parsed number to phData array
    } else if (co2Match){
      const co2Value = parseFloat(co2Match[1]); // Convert the matched number to a float
      setCo2Data(prevData => [...prevData, co2Value]); // Add the parsed number to co2Data array
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

  const sentData = "co2: 1092";
  
  return (
    <SafeAreaView style={styles.container}>
      {receivedData ? <LiveLineChart phData={phData} co2Data={co2Data}/>: null}
      <View style={styles.TitleWrapper}>
        {connectedDevice ? (
            <View style={styles.columnWrapper}>
            <View style={styles.column}>
            <Text style={styles.item}>
                  ${receivedData}
            </Text>
            </View>
            <View style={styles.column}>
                <Text style={styles.item}>
                  ${sentData}
                </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.TitleText}>
            Please Connect to a BLE device
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={connectedDevice ? disconnectFromDevice : openModal}
        style={styles.ctaButton}
      >
        <Text style={styles.ctaButtonText}>
          {connectedDevice ? "Disconnect" : "Connect"}
        </Text>
      </TouchableOpacity>
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
    marginHorizontal: 20,
    marginBottom: "30%",
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  columnWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  column: {
    flex: 1,
  },
  item: {
    backgroundColor: "lightblue",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    color:"black",
  },
  chart: {
    width: '20%', // Adjust width as needed
    height: 200, // Adjust height as needed
  },
});

export default App;