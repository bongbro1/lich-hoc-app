import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useUser } from "../contexts/UserContext";

type SweetAlertProps = {
  visible: boolean;
  type?: "success" | "error" | "info" | "warning";
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

const TYPE_CONFIG = {
  success: {
    icon: "check-circle",
    color: "#22C55E",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  error: {
    icon: "close-circle",
    color: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  warning: {
    icon: "alert-circle",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  info: {
    icon: "information",
    color: "#3B82F6",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
};

export default function SweetAlert({
  visible,
  type = "info",
  title = "Thông báo",
  message = "",
  confirmText = "OK",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
}: SweetAlertProps) {
  const { darkMode } = useUser();
  const [prevVisible, setPrevVisible] = React.useState(visible);
  const [showModal, setShowModal] = React.useState(visible);
  const scaleAnim = useRef(new Animated.Value(visible ? 1 : 0.85)).current;
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setShowModal(true);
      scaleAnim.setValue(0.85);
      fadeAnim.setValue(0);
    }
  }

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 18,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setShowModal(false);
        }
      });
    }
  }, [visible]);

  const config = TYPE_CONFIG[type];

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel || (() => { })}
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={onCancel || (type !== 'warning' ? onConfirm : () => { })}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.card,
            { backgroundColor: darkMode ? '#1E293B' : '#fff', transform: [{ scale: scaleAnim }], opacity: fadeAnim },
          ]}
        >
          {/* Icon circle */}
          <View style={[styles.iconCircle, {
            backgroundColor: darkMode ? (config.color + '20') : config.bg,
            borderColor: darkMode ? (config.color + '40') : config.border
          }]}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={44}
              color={config.color}
            />
          </View>

          <Text style={[styles.title, { color: darkMode ? '#F8FAFC' : '#111827' }]}>{title}</Text>

          {message ? (
            <Text style={[styles.message, { color: darkMode ? '#94A3B8' : '#6B7280' }]}>{message}</Text>
          ) : null}

          {/* Actions */}
          <View style={[styles.actions, !onCancel && styles.actionsSingle]}>
            {onCancel && (
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnCancel,
                  { 
                    backgroundColor: darkMode ? '#334155' : '#F3F4F6',
                    transform: [{ scale: pressed ? 0.96 : 1 }]
                  }
                ]}
                onPress={onCancel}
                android_ripple={{ color: darkMode ? '#475569' : '#E5E7EB' }}
              >
                <Text style={[styles.btnCancelText, { color: darkMode ? '#F8FAFC' : '#374151' }]}>{cancelText}</Text>
              </Pressable>
            )}
            {onConfirm && (
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnConfirm,
                  { 
                    backgroundColor: config.color,
                    transform: [{ scale: pressed ? 0.96 : 1 }]
                  }
                ]}
                onPress={onConfirm}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <Text style={styles.btnConfirmText}>{confirmText}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 22,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 24,
    alignItems: "center",
    width: "82%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    marginTop: 22,
    gap: 10,
    width: "100%",
  },
  actionsSingle: {
    justifyContent: "center",
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    backgroundColor: "#F3F4F6",
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  btnConfirm: {
    // backgroundColor set dynamically
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
