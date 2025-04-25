import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import StarRating from 'react-native-star-rating';
import { Colors } from '../../constants/colors';
import { useDarkMode } from '../../context/DarkModeContext';

const FeedbackModal = ({ visible, onClose, onSubmit, orderId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { theme } = useDarkMode();

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit({
        orderId,
        rating,
        comment,
        date: new Date().toISOString(),
      });
      setRating(0);
      setComment('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surfaceColor }]}>
          <Text style={[styles.title, { color: theme.textColor }]}>Rate Your Experience</Text>
          
          <View style={styles.ratingContainer}>
            <StarRating
              disabled={false}
              maxStars={5}
              rating={rating}
              selectedStar={(rating) => setRating(rating)}
              fullStarColor={Colors.warning}
              starSize={30}
            />
          </View>
          
          <TextInput
            style={[styles.commentInput, { 
              backgroundColor: theme.backgroundColor, 
              color: theme.textColor,
              borderColor: theme.textColor 
            }]}
            placeholder="Tell us about your experience..."
            placeholderTextColor={theme.textColor}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={rating === 0}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  commentInput: {
    height: 100,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.danger,
  },
  submitButton: {
    backgroundColor: Colors.primary,
},
buttonText: {
  color: Colors.white,
  fontWeight: 'bold',
},
});

export default FeedbackModal;