import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { LineChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';

const LiveLineChart = ({ phData, co2Data }: { phData: number[], co2Data:number[] }) => {
  const [chartPhData, setChartPhData] = useState<number[]>([]);
  const [chartCo2Data, setChartCo2Data] = useState<number[]>([]);
  useEffect(() => {
    // Update chart data when new data is received
    setChartPhData(phData);
  }, [phData]);

  useEffect(() => {
    setChartCo2Data(co2Data);
  }, [co2Data]);

  // const xAxisData = data.map((value, index) => ({ value: index, label: `${index}` }));
  const yAxisData_ph = phData;
  const yAxisData_co2 = co2Data;

  return (
    <View style={{ flex: 1, margin:10 }}>
      <Text style={{color:"black"}}>PH Data Plot</Text>
      <View style={{ height: 200, flexDirection: 'row' }}>
        <YAxis
          data={yAxisData_ph}
          contentInset={{ top: 20, bottom: 20 }}
          svg={{ fontSize: 10, fill: 'grey' }}
          numberOfTicks={10}
          formatLabel={(value:any) => `${value.toFixed(2)}`}
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

      <Text style={{color:"black"}}>CO2 Data Plot</Text>
      <View style={{ height: 200, flexDirection: 'row' }}>
      <YAxis
          data={yAxisData_co2}
          contentInset={{ top: 20, bottom: 20 }}
          svg={{ fontSize: 10, fill: 'grey' }}
          numberOfTicks={10}
          formatLabel={(value:any) => `${value.toFixed(2)}`}
        />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <LineChart
            style={{ flex: 1 }}
            data={co2Data}
            svg={{ stroke: 'rgb(134, 65, 244)' }}
            contentInset={{ top: 20, bottom: 20 }}
            yAccessor={({ item }:{item:any}) => item}
            xAccessor={({ index }:{index:any}) => index}
          >
            <Grid />
          </LineChart>
          </View>
      </View>
    </View>
  );
};

export default LiveLineChart;
