import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { useDarkMode } from '../../context/DarkModeContext';

const SchedulePicker = ({ onScheduleChange }) => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [frequency, setFrequency] = useState('once');
  const { theme } = useDarkMode();

  const frequencies = [
    { id: 'once', label: 'One-time' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'biweekly', label: 'Bi-weekly' },
  ];

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      onScheduleChange({
        date: selectedDate,
        frequency,
      });
    }
  };

  const handleFrequencyChange = (selectedFrequency) => {
    setFrequency(selectedFrequency);
    onScheduleChange({
      date,
      frequency: selectedFrequency,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textColor }]}>Schedule Pickup</Text>
      
      <TouchableOpacity 
        style={[styles.dateButton, { backgroundColor: theme.surfaceColor }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.dateText, { color: theme.textColor }]}>
          {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display="default"
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}

      <View style={styles.frequencyContainer}>
        {frequencies.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.frequencyButton,
              frequency === item.id && styles.selectedFrequencyButton,
              { backgroundColor: theme.surfaceColor }
            ]}
            onPress={() => handleFrequencyChange(item.id)}
          >
            <Text style={[
              styles.frequencyText,
              { color: frequency === item.id ? Colors.primary : theme.textColor }
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  dateButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    padding: 12,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center',
  },
  selectedFrequencyButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  frequencyText: {
    fontSize: 14,
  },
});

export default SchedulePicker;