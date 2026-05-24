import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { handleNotificationRedirect } from '../helpers/notificationRedirect';

export const InAppBanner = ({ title, body, data }: any) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => handleNotificationRedirect(data)}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 12,
    zIndex: 9999,
  },
  title: {
    color: '#fff',
    fontWeight: '600',
  },
  body: {
    color: '#ddd',
    marginTop: 4,
  },
});
