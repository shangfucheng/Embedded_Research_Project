import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, StyleSheet, Dimensions} from 'react-native';
// import { LineChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';

import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryZoomContainer,
} from 'victory-native';

const MAX_DATA_BUFFER = 30000;

const StaticLineChart = React.memo(({data, minMax, selectedPlot}: {data: Map<string, Map<string, number[]>>, minMax: Map<string, {min:number, max:number}>, selectedPlot: string}) => {
  // only display the last number? of data points
  const plotWindowSize = selectedPlot==="all" ? -MAX_DATA_BUFFER: -30;
  const width = Dimensions.get('window').width * 0.95;

  return (
    <ScrollView contentContainerStyle={{flexGrow: 1, marginBottom: 5}}>
      { Array.from(data.entries()).map(([skey, sData], index) => (
        (skey === selectedPlot || selectedPlot === "all") &&
        <View key={skey} style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{`Chart for ${skey}`}</Text>
          {Array.from(sData.entries()).map(([lineKey, lineData]) => (
            <Text style={lineKey.includes("X")? styles.lineX: lineKey.includes("Y")? styles.lineY: styles.lineZ}>
              {`${lineKey}: ${lineData[lineData.length-1]}`}</Text>)
          )}

          <VictoryChart
            width={width}
            height={350}
            theme={VictoryTheme.material}
            domain={{y: [minMax.get(skey)?.min || 0, minMax.get(skey)?.max || 0]}}
            containerComponent={<VictoryZoomContainer zoomDimension='x' />}>            
            <VictoryAxis
              dependentAxis
              tickCount={15}
              tickFormat={tick => tick.toFixed(3)}
              style={{
                axis: {stroke: 'grey'},
                ticks: {size: 5},
                tickLabels: {fontSize: 8, fill: 'grey', angle: 45},
                
              }}
            />
            {Array.from(sData.entries()).map(([lineKey, lineData]) => (
              <VictoryLine
                key={lineKey}
                data={lineData.slice(plotWindowSize).map((value, index) => ({x: index, y: value}))}
                style={{
                  data: {
                    opacity: 0.4,
                    stroke:
                      lineKey.includes('X')
                        ? 'blue'
                        : lineKey.includes('Y')
                        ? 'green'
                        : 'red',
                  },
                }}
              />
            ))}
          </VictoryChart>
        </View>
      ))}
    </ScrollView>
  );
});

const LiveLineChart = ({data, minMax, selectedPlot}: {data: Map<string, Map<string, number[]>>, minMax: Map<string, {min:number, max:number}>, selectedPlot: string}) => {
  // only display the last number? of data points
  const plotWindowSize = selectedPlot==="all" ? -MAX_DATA_BUFFER: -30;
  const width = Dimensions.get('window').width * 0.95;

  return (
    <ScrollView contentContainerStyle={{flexGrow: 1, marginBottom: 5}}>
      { Array.from(data.entries()).map(([skey, sData], index) => (
        (skey === selectedPlot || selectedPlot === "all") &&
        <View key={skey} style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{`Chart for ${skey}`}</Text>
          {Array.from(sData.entries()).map(([lineKey, lineData]) => (
            <Text style={lineKey.includes("X")? styles.lineX: lineKey.includes("Y")? styles.lineY: styles.lineZ}>
              {`${lineKey}: ${lineData[lineData.length-1]}`}</Text>)
          )}

          <VictoryChart
            width={width}
            height={350}
            theme={VictoryTheme.material}
            domain={{y: [minMax.get(skey)?.min || 0, minMax.get(skey)?.max || 0]}}
            containerComponent={<VictoryZoomContainer zoomDimension='x' />}>            
            <VictoryAxis
              dependentAxis
              tickCount={15}
              tickFormat={tick => tick.toFixed(3)}
              style={{
                axis: {stroke: 'grey'},
                ticks: {size: 5},
                tickLabels: {fontSize: 8, fill: 'grey', angle: 45},
                
              }}
            />
            {Array.from(sData.entries()).map(([lineKey, lineData]) => (
              <VictoryLine
                key={lineKey}
                data={lineData.slice(plotWindowSize).map((value, index) => ({x: index, y: value}))}
                style={{
                  data: {
                    opacity: 0.4,
                    stroke:
                      lineKey.includes('X')
                        ? 'blue'
                        : lineKey.includes('Y')
                        ? 'green'
                        : 'red',
                  },
                }}
              />
            ))}
          </VictoryChart>
        </View>
      ))}
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  chartContainer: {
    flex: 1,
    margin: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'black',
  },
  legend: {
    color: 'black',
    fontSize: 16,
    marginBottom: 3,
  },
  lineX: {
    color: 'blue',
    fontSize: 16,
    marginBottom: 3,
  },
  lineY: {
    color: 'green',
    fontSize: 16,
    marginBottom: 3,
  },
  lineZ: {
    color: 'red',
    fontSize: 16,
    marginBottom: 3,
  },
});

export {LiveLineChart, StaticLineChart};