import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import DeviceModal from './deviceModal';
import BLEDeviceScreen from './BLEScreen';
import {LiveLineChart, StaticLineChart} from './LineChart';
import SaveFiles from './SaveFiles';
import Svg, {
  Circle,
  Path,
  Rect,
  Line,
  Polygon,
  Text as SvgText,
} from 'react-native-svg';

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
  const MAX_DATA_BUFFER = 30000;

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const rawSensorData = useRef<String[]>([]);
  const dataQueue = useRef<String[]>([]);
  const [showPlot, setShowPlot] = useState<boolean>(false);
  const prevShowPlot = useRef(showPlot);
  const [selectLivePlot, setSelectLivePlot] = useState<string>('');
  const dataMap = useRef<Map<string, Map<string, number[]>>>(new Map());
  const minMax = useRef<Map<string, {min: number; max: number}>>(new Map());
  const memoizedDataMap = useMemo(() => dataMap.current, [dataMap.current]);
  const memoizedMinMax = useMemo(() => minMax.current, [minMax.current]);
  const Acc = useRef({ax: 0, ay: 0, az: 0});
  const Gyro = useRef({gx: 0, gy: 0, gz: 0});
  const Voltage = useRef({v0: 0, v1: 0, v2: 0, v3: 0, v4: 0, v5: 0});
  const [refresh, setRefresh] = useState<boolean>(false);

  const parseSensorData = (data: String) => {
    const keyValuePairs = data.split('; ');
    if (keyValuePairs.length < 8) return;
    // first is gX: 0.00, gY: 0.00, gZ: 0.00
    const gyroData = keyValuePairs[0].split(', ');
    Gyro.current.gx = parseFloat(gyroData[0].split(': ')[1]);
    Gyro.current.gy = parseFloat(gyroData[1].split(': ')[1]);
    Gyro.current.gz = parseFloat(gyroData[2].split(': ')[1]);
    // second is aX: 0.00, aY: 0.00, aZ: 0.00
    const accData = keyValuePairs[1].split(', ');
    Acc.current.ax = parseFloat(accData[0].split(': ')[1]);
    Acc.current.ay = parseFloat(accData[1].split(': ')[1]);
    Acc.current.az = parseFloat(accData[2].split(': ')[1]);
    // third is v0: 0.00, v1: 0.00, v2: 0.00, v3: 0.00, v4: 0.00, v5: 0.00
    Voltage.current.v0 = parseFloat(keyValuePairs[2].split(': ')[1]);
    Voltage.current.v1 = parseFloat(keyValuePairs[3].split(': ')[1]);
    Voltage.current.v2 = parseFloat(keyValuePairs[4].split(': ')[1]);
    Voltage.current.v3 = parseFloat(keyValuePairs[5].split(': ')[1]);
    Voltage.current.v4 = parseFloat(keyValuePairs[6].split(': ')[1]);
    Voltage.current.v5 = parseFloat(keyValuePairs[7].split(': ')[1]);
  };
  useEffect(() => {
    rawSensorData.current.push(receivedData);
    parseSensorData(receivedData);
    if (selectLivePlot && selectLivePlot != '') {
      handleIncomingData('-1');
    }
  }, [receivedData]);

  // called when showPlot changes
  useEffect(() => {
    if (showPlot && prevShowPlot.current !== showPlot) {
      for (let i = 0; i < rawSensorData.current.length; i++) {
        handleIncomingData(rawSensorData.current[i]);
      }
    }

    prevShowPlot.current = showPlot;
  }, [showPlot]);

  const updateToDataMap = () => {
    // update Gyro, Acc, Voltage
    updateDataMap('Gyroscope', 'gX', Gyro.current.gx);
    updateDataMap('Gyroscope', 'gY', Gyro.current.gy);
    updateDataMap('Gyroscope', 'gZ', Gyro.current.gz);
    updateDataMap('Accelerometer', 'aX', Acc.current.ax);
    updateDataMap('Accelerometer', 'aY', Acc.current.ay);
    updateDataMap('Accelerometer', 'aZ', Acc.current.az);
    updateDataMap('V0', 'v0', Voltage.current.v0);
    updateDataMap('V1', 'v1', Voltage.current.v1);
    updateDataMap('V2', 'v2', Voltage.current.v2);
    updateDataMap('V3', 'v3', Voltage.current.v3);
    updateDataMap('V4', 'v4', Voltage.current.v4);
    updateDataMap('V5', 'v5', Voltage.current.v5);
  };
  function handleIncomingData(data: String) {
    if (data === '') return;
    if (data === '-1') {
      updateToDataMap();
    } else {
      parseSensorData(data);
      updateToDataMap();
    }
  }

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
    rawSensorData.current = [];
    dataQueue.current = [];
    minMax.current = new Map();
    dataMap.current = new Map();
    Acc.current = {ax: 0, ay: 0, az: 0};
    Gyro.current = {gx: 0, gy: 0, gz: 0};
    Voltage.current = {v0: 0, v1: 0, v2: 0, v3: 0, v4: 0, v5: 0};
    setRefresh(!refresh); // force a re-render
  };

  function updateDataMap(sensorName: string, typeTag: string, sData: number) {
    const MAX_DATA_POINTS = MAX_DATA_BUFFER;
    let sensorData = dataMap.current?.get(sensorName) || new Map();

    let typeMap = sensorData.get(typeTag);
    if (typeMap) {
      typeMap.push(sData);
      // if the sensor data is more than MAX_DATA_POINTS
      if (typeMap.length > MAX_DATA_POINTS) {
        // remove the first element
        typeMap = typeMap.slice(-MAX_DATA_POINTS);
      }
    } else {
      const newTypeMap: number[] = [];
      newTypeMap.push(sData);
      sensorData.set(typeTag, newTypeMap);
    }

    dataMap.current?.set(sensorName, sensorData);

    // update minMax of sensor
    let sensorMinMax = minMax.current?.get(sensorName) || {
      min: sData,
      max: sData,
    };
    sensorMinMax.min = Math.min(sensorMinMax.min, sData);
    sensorMinMax.max = Math.max(sensorMinMax.max, sData);
    minMax.current?.set(sensorName, sensorMinMax);
  }

  const saveFileCallback = () => {
    rawSensorData.current = rawSensorData.current.concat(dataQueue.current);
    return rawSensorData.current;
  };
  // Memoize the LiveLineChart component
  const LiveLineChartMemo = useMemo(
    () => (
      <StaticLineChart
        data={memoizedDataMap}
        minMax={memoizedMinMax}
        selectedPlot="all"
      />
    ),
    [memoizedDataMap, memoizedMinMax, showPlot],
  );

  const onPress_menu = () => {
    console.log('Menu Button Pressed');
  };
  const onPress_play = () => {
    console.log('Play Button Pressed');
  };
  const onPress_back = () => {
    console.log('Back Button Pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {dataMap.current.size > 0 && showPlot ? LiveLineChartMemo : null}
        <View>
          {!connectedDevice ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '50%',
              }}>
              <Text style={styles.TitleText}>
                Please Connect to a BLE device First
              </Text>
              <TouchableOpacity
                onPress={connectedDevice ? disconnectFromDevice : openModal}
                style={styles.ctaButton}>
                <Text style={styles.ctaButtonText}>
                  {connectedDevice ? 'Disconnect' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.TitleText}>
                Connected to {connectedDevice.name}
              </Text>

              {selectLivePlot && dataMap.current.has(selectLivePlot) ? (
                <LiveLineChart
                  data={dataMap.current}
                  minMax={minMax.current}
                  selectedPlot={selectLivePlot}
                />
              ) : null}

              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '1%',
                  width: '100%',
                }}>
                <View
                  style={{
                    width: '47%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Svg width={150} height={150} viewBox="0 0 64 64">
                    {/* Triangle */}
                    <Polygon points="32,5 5,59 59,59" fill={'gold'} />
                    {/* Exclamation Mark */}
                    <SvgText
                      x="32"
                      y="40"
                      fontSize="36"
                      fontWeight="bold"
                      fill={'white'}
                      textAnchor="middle"
                      alignmentBaseline="middle">
                      !
                    </SvgText>
                  </Svg>
                </View>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'column',
                    width: '47%',
                    alignItems: 'center',
                    margin: '1%',
                  }}>
                  <View style={{width: '100%'}}>
                    <TouchableOpacity
                      onPress={() =>
                        selectLivePlot == 'Gyroscope'
                          ? setSelectLivePlot('')
                          : setSelectLivePlot('Gyroscope')
                      }
                      style={
                        selectLivePlot == 'Gyroscope'
                          ? styles.pickerSelected
                          : styles.picker
                      }>
                      <Text style={styles.ImuLabel}>Shaking</Text>
                      {/* <Text style={styles.ImuLabel}>X: {Gyro.current.gx}</Text>
                      <Text style={styles.ImuLabel}>Y: {Gyro.current.gy}</Text>
                      <Text style={styles.ImuLabel}>Z: {Gyro.current.gz}</Text> */}
                    </TouchableOpacity>
                  </View>

                  <View style={{width: '100%'}}>
                    <TouchableOpacity
                      onPress={() =>
                        selectLivePlot == 'Accelerometer'
                          ? setSelectLivePlot('')
                          : setSelectLivePlot('Accelerometer')
                      }
                      style={
                        selectLivePlot == 'Accelerometer'
                          ? styles.pickerSelected
                          : styles.picker
                      }>
                      <Text style={styles.ImuLabel}>Fall Down</Text>
                      {/* <Text style={styles.ImuLabel}>X: {Acc.current.ax}</Text>
                      <Text style={styles.ImuLabel}>Y: {Acc.current.ay}</Text>
                      <Text style={styles.ImuLabel}>Z: {Acc.current.az}</Text> */}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.sensorBtnBox}>
                <View style={styles.sensorBtnContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      selectLivePlot == 'V0'
                        ? setSelectLivePlot('')
                        : setSelectLivePlot('V0')
                    }
                    style={
                      selectLivePlot == 'V0'
                        ? styles.pickerSelected
                        : styles.pickerLdopa
                    }>
                    <Text style={styles.pickerLabel}>L-dopa</Text>
                    <Text style={styles.pickerLabel}>{Voltage.current.v0}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.sensorBtnContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      selectLivePlot == 'V1'
                        ? setSelectLivePlot('')
                        : setSelectLivePlot('V1')
                    }
                    style={
                      selectLivePlot == 'V1'
                        ? styles.pickerSelected
                        : styles.pickerUa
                    }>
                    <Text style={styles.pickerLabel}>UA</Text>
                    <Text style={styles.pickerLabel}>{Voltage.current.v1}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.sensorBtnContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      selectLivePlot == 'V2'
                        ? setSelectLivePlot('')
                        : setSelectLivePlot('V2')
                    }
                    style={
                      selectLivePlot == 'V2'
                        ? styles.pickerSelected
                        : styles.pickerLa
                    }>
                    <Text style={styles.pickerLabel}>LA</Text>
                    <Text style={styles.pickerLabel}>{Voltage.current.v2}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.sensorBtnContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      selectLivePlot == 'V3'
                        ? setSelectLivePlot('')
                        : setSelectLivePlot('V3')
                    }
                    style={
                      selectLivePlot == 'V3'
                        ? styles.pickerSelected
                        : styles.pickerGlu
                    }>
                    <Text style={styles.pickerLabel}>Glu</Text>
                    <Text style={styles.pickerLabel}>{Voltage.current.v3}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.sensorBtnContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      selectLivePlot == 'V4'
                        ? setSelectLivePlot('')
                        : setSelectLivePlot('V4')
                    }
                    style={
                      selectLivePlot == 'V4'
                        ? styles.pickerSelected
                        : styles.pickerPh
                    }>
                    <Text style={styles.pickerLabel}>pH</Text>
                    <Text style={styles.pickerLabel}>{Voltage.current.v4}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.sensorBtnContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      selectLivePlot == 'V5'
                        ? setSelectLivePlot('')
                        : setSelectLivePlot('V5')
                    }
                    style={
                      selectLivePlot == 'V5'
                        ? styles.pickerSelected
                        : styles.pickerTemp
                    }>
                    <Text style={styles.pickerLabel}>Temp</Text>
                    <Text style={styles.pickerLabel}>{Voltage.current.v5}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* <TouchableOpacity
                onPress={clearDataCallback}
                style={styles.clearBtn}>
                <Text style={styles.ctaButtonText}>Clear Data</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPlot(!showPlot)}
                style={styles.clearBtn}>
                {showPlot ? (
                  <Text style={styles.ctaButtonTextStop}>Hide All Plot</Text>
                ) : (
                  <Text style={styles.ctaButtonText}>Show All Plot</Text>
                )}
              </TouchableOpacity> */}

              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  columnGap: 50,
                  marginTop:20,
                }}>
                {/* menu button */}
                <TouchableOpacity onPress={onPress_menu} activeOpacity={0.2}>
                  <Svg width={64} height={64} viewBox="0 0 64 64">
                    {/* Rectangle with Rounded Corners */}
                    <Rect
                      x="5"
                      y="5"
                      width="54"
                      height="54"
                      rx={10}
                      ry={10}
                      fill={'gainsboro'}
                    />
                    {/* Vertical Lines */}
                    <Line
                      x1="20"
                      y1="15"
                      x2="20"
                      y2="49"
                      stroke={'black'}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <Line
                      x1="32"
                      y1="15"
                      x2="32"
                      y2="49"
                      stroke={'black'}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <Line
                      x1="44"
                      y1="15"
                      x2="44"
                      y2="49"
                      stroke={'black'}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </Svg>
                </TouchableOpacity>

                {/* play button */}
                <TouchableOpacity onPress={onPress_play} activeOpacity={0.2}>
                  <Svg width={64} height={64} viewBox="0 0 64 64">
                    {/* Circle Background */}
                    <Circle
                      cx="32"
                      cy="32"
                      r="30"
                      stroke="none"
                      fill={'black'}
                    />
                    {/* Play Button Triangle */}
                    <Path d="M26 20L44 32L26 44V20Z" fill={'red'} />
                  </Svg>
                </TouchableOpacity>

                {/* back button */}
                <TouchableOpacity onPress={onPress_back} activeOpacity={0.2}>
                  <Svg width={64} height={64} viewBox="0 0 64 64">
                    {/* Rectangle with Rounded Corners */}
                    <Rect
                      x="5"
                      y="5"
                      width="54"
                      height="54"
                      rx={10}
                      ry={10}
                      fill={'gainsboro'}
                    />
                    {/* Left Arrow (<) */}
                    <Path
                      d="M36 20L24 32L36 44"
                      fill="none"
                      stroke={'black'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* <TouchableOpacity onPress={disconnectFromDevice} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Disconnect All</Text>
            </TouchableOpacity> */}
        <DeviceModal
          closeModal={hideModal}
          visible={isModalVisible}
          connectToPeripheral={connectToDevice}
          devices={devices}
        />

        {/* {connectedDevice && <SaveFiles data={saveFileCallback()} />} */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    flexDirection: 'column',
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionButton: {
    backgroundColor: '#FF6060',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: '60%',
    margin: 10,
    borderRadius: 8,
  },
  selectionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  TitleWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
  },
  TitleText: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 20,
    color: 'black',
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#FF6060',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: '90%',
    // marginHorizontal: 10,
    // marginBottom: 20,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  ctaButtonTextStop: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'blue',
  },
  columnWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flex: 1,
    height: 50,
    backgroundColor: 'lightblue',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  item: {
    fontSize: 16,
    color: 'black',
    flexWrap: 'wrap',
    height: 50,
    alignSelf: 'center',
    paddingTop: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    color: 'black',
  },
  pickerLabel: {
    fontSize: 21,
    fontWeight: 'bold',
    marginRight: 10,
    color: 'black',
    alignSelf: 'center',
  },
  ImuLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 10,
    color: 'black',
    alignSelf: 'center',
  },
  picker: {
    color: 'black',
    backgroundColor: 'gainsboro',
    justifyContent: 'center',
    // width: '100%',
    height: 100,
    margin: 10,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 8,
  },
  pickerLdopa: {
    color: 'black',
    backgroundColor: 'yellowgreen',
    justifyContent: 'center',
    width: '100%',
    height: 100,
    margin: 10,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 8,
  },
  pickerUa: {
    color: 'black',
    backgroundColor: 'plum',
    justifyContent: 'center',
    width: '100%',
    height: 100,
    margin: 10,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 8,
  },
  pickerLa: {
    color: 'black',
    backgroundColor: 'peachpuff',
    justifyContent: 'center',
    width: '100%',
    height: 100,
    margin: 10,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 8,
  },
  pickerGlu: {
    color: 'black',
    backgroundColor: 'powderblue',
    justifyContent: 'center',
    width: '100%',
    height: 100,
    margin: 10,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 8,
  },
  pickerPh: {
    color: 'black',
    backgroundColor: 'silver',
    justifyContent: 'center',
    width: '100%',
    height: 100,
    margin: 10,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 8,
  },
  pickerTemp: {
    color: 'black',
    backgroundColor: 'salmon',
    justifyContent: 'center',
    width: '100%',
    height: 100,
    margin: 10,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 8,
  },
  pickerSelected: {
    color: 'black',
    backgroundColor: 'cadetblue',
    justifyContent: 'center',
    width: '100%',
    height: 100,
    margin: 10,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 8,
  },
  sensorBtnContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1%',
    height: 100,
    width: '47%',
  },
  sensorBtnBox: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    // columnGap: 20,
    flexWrap: 'wrap',
    borderColor: 'black',
    borderWidth: 2,
    backgroundColor: 'white',
  },
  clearBtn: {
    backgroundColor: 'lightgreen',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    height: 50,
    width: '90%',
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
});

export default App;
