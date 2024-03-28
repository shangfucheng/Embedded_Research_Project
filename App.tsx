import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DeviceModal from "./deviceModal";
import BLEDeviceScreen from "./BLEScreen";

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
      <View style={styles.TitleWrapper}>
        {connectedDevice ? (
          // <>
          //   <Text style={{color:"black"}}>${receivedData}</Text>
          // </>
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
});

export default App;