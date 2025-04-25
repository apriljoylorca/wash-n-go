import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const SchedulePicker = ({ value, onChange }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value?.date || new Date());

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Preserve the current time when changing date
      const currentTime = value?.date || new Date();
      selectedDate.setHours(currentTime.getHours());
      selectedDate.setMinutes(currentTime.getMinutes());
      setSelectedDate(selectedDate);
      onChange({ ...value, date: selectedDate });
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Create a new date with the selected time
      const newDate = value?.date ? new Date(value.date) : new Date();
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setSelectedDate(newDate);
      onChange({ ...value, date: newDate });
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Select Time';
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerRow}>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialIcons name="calendar-today" size={24} color={Colors.primary} />
          <Text style={styles.pickerText}>
            {formatDate(value?.date)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowTimePicker(true)}
        >
          <MaterialIcons name="access-time" size={24} color={Colors.primary} />
          <Text style={styles.pickerText}>
            {formatTime(value?.date)}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.frequencyContainer}>
        <TouchableOpacity
          style={[
            styles.frequencyButton,
            value?.frequency === 'once' && styles.selectedFrequency
          ]}
          onPress={() => onChange({ ...value, frequency: 'once' })}
        >
          <Text style={[
            styles.frequencyText,
            value?.frequency === 'once' && styles.selectedFrequencyText
          ]}>
            One-time
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.frequencyButton,
            value?.frequency === 'weekly' && styles.selectedFrequency
          ]}
          onPress={() => onChange({ ...value, frequency: 'weekly' })}
        >
          <Text style={[
            styles.frequencyText,
            value?.frequency === 'weekly' && styles.selectedFrequencyText
          ]}>
            Weekly
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
          is24Hour={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  selectedFrequency: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  frequencyText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedFrequencyText: {
    color: Colors.white,
  },
});

export default SchedulePicker; 