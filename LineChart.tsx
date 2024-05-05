import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { LineChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';

type InsoleDataType = [number, number, number, number, number, number, number, number];
// type InsoleDataType = [number, number, number, number];

const LiveLineChart = ({ phData, insoleData }: { phData: number[], insoleData:InsoleDataType }) => {
  const [chartPhData, setChartPhData] = useState<number[]>([]);
  const [chartInsoleAcc, setChartInsoleAcc] = useState<number[][]>([]);
  const [chartInsoleIma, setChartInsoleIma] = useState<number[][]>([]);
  const [chartInsoleS1, setChartInsoleS1] = useState<number[][]>([]);
  const [chartInsoleS2, setChartInsoleS2] = useState<number[][]>([]);

  useEffect(() => {
    // Update chart data when new data is received
    setChartPhData(phData);
  }, [phData]);

  useEffect(() => {
    if (insoleData.length >= 8) {
      // Destructure the insoleData array to extract specific values for each chart category
      const [X, Y, Z, aX, aY, aZ, s1, s2] = insoleData;

      // Set chartInsoleAcc with X1, Y1, Z1
      setChartInsoleAcc(prevData => [...prevData, [X, Y, Z]]);

      // Set chartInsoleIma with aX, aY, aZ
      setChartInsoleIma(prevData => [...prevData, [aX, aY, aZ]]);

      // Set chartInsoleS1 with s1
      setChartInsoleS1(prevData => [...prevData, [s1]]);

      // Set chartInsoleS2 with s2
      setChartInsoleS2(prevData => [...prevData, [s2]]);
    }
  }, [insoleData]);

  // const xAxisData = data.map((value, index) => ({ value: index, label: `${index}` }));
  const yAxisData_ph = phData;
  const yAxisData_insole = insoleData;

  return (
    <View style={{ flex: 1, margin:10 }}>
      <Text style={{color:"black"}}>PH Data Plot</Text>
      <View style={{ height: 200, flexDirection: 'row' }}>
        <YAxis
          data={yAxisData_ph}
          contentInset={{ top: 20, bottom: 20 }}
          svg={{ fontSize: 10, fill: 'grey' }}
          numberOfTicks={10}
          formatLabel={(value:any) => `${value.toFixed(3)}`}
        />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <LineChart
            style={{ flex: 1 }}
            data={phData}
            svg={{ stroke: 'rgb(134, 65, 244)' }}
            contentInset={{ top: 20, bottom: 20 }}
            yAccessor={({ item }:{item:any}) => item}
            xAccessor={({ index }:{index:any}) => index}
          >
            <Grid />
          </LineChart>
          {/* <XAxis
            style={{ marginHorizontal: -10, marginTop: 10 }}
            data={xAxisData}
            formatLabel={(value:any, index:any) => xAxisData[index].label}
            contentInset={{ left: 10, right: 10 }}
            svg={{ fontSize: 10, fill: 'grey' }}
          /> */}
        </View>
      </View>
    </View>
  );
};

export default LiveLineChart;
