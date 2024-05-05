import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

const SaveFiles = ({data}:{data:String[]}) => {
  const [fileName, setFileName] = useState<string>("phData");

  const saveDataToFile = async () => {
    if (!fileName) {
        Alert.alert('Error', 'Please enter a filename');
        return;
    }
  
    const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    try {
       // Convert the array to a string before writing to the file
      const dataString = data.join(' | '); // Join array elements with a comma
      await RNFS.writeFile(filePath, dataString, 'utf8');
      console.log('Data saved to file successfully! ', filePath);
      Alert.alert('Success', 'Data saved to file successfully!');
    } catch (error) {
      console.error('Error saving data to file:', error);
      Alert.alert('Error', 'Failed to save data to file.');
    }
  };
  const shareFile = async () => {
    if (!fileName) {
        Alert.alert('Error', 'Please enter a filename');
        return;
    }
    const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    const options = {
        url: `file://${filePath}`,
    };

    try {
    const res = await Share.open(options);
        console.log('Shared successfully:', res);
    } catch (error) {
        console.error('Error while sharing:', error);
    }
};

  return (
    <View>
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
        placeholder="Enter filename"
        value={fileName}
        onChangeText={setFileName}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
        <TouchableOpacity  onPress={saveDataToFile} style={styles.btn}>
            <Text style={styles.txt}>
                SAVE
            </Text>
        </TouchableOpacity>
        <TouchableOpacity  onPress={shareFile} style={styles.btn}>
            <Text style={styles.txt}>
                SHARE
            </Text>
         </TouchableOpacity>
      </View>
      
    </View>
    
  );
};

const styles = StyleSheet.create({
    btn:{
        backgroundColor: "cadetblue",
        justifyContent: "center",
        alignItems: "center",
        height: 50,
        width: "45%",
        marginHorizontal: 10,
        marginBottom: 20,
        borderRadius: 8,
    }, 
    txt:{
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
    }
});

export default SaveFiles;
