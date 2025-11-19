import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';


const GradientBackground = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4db5e2ff', '#25353aff', '#b7b1c8ff']}
        style={styles.gradient}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default GradientBackground;