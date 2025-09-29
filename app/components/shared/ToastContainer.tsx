import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useToast } from '../../contexts/ToastContext';
import ToastComponent from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onDismiss={hideToast}
          index={index}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});

export default ToastContainer;