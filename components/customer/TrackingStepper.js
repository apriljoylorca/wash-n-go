import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const TrackingStepper = ({ steps, currentStatus }) => {
  const getStatusIndex = () => {
    return steps.findIndex(step => step.key === currentStatus);
  };
  
  const currentIndex = getStatusIndex();
  
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === steps.length - 1;
        
        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepContainer}>
              <View style={[
                styles.stepCircle,
                isCompleted && { backgroundColor: Colors.success },
                isCurrent && { backgroundColor: Colors.primary },
                !isCompleted && !isCurrent && { backgroundColor: Colors.lightGray },
              ]}>
                {isCompleted ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    isCurrent && { color: Colors.white },
                  ]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              
              <Text style={[
                styles.stepTitle,
                { color: Colors.textColor },
                (isCompleted || isCurrent) && { fontWeight: 'bold' },
              ]}>
                {step.title}
              </Text>
            </View>
            
            {!isLast && (
              <View style={[
                styles.connector,
                isCompleted && { backgroundColor: Colors.success },
                !isCompleted && { backgroundColor: Colors.lightGray },
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 16,
  },
  connector: {
    width: 2,
    height: 20,
    marginLeft: 14,
  },
});

export default TrackingStepper;