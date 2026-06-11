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
              size={32}
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
    borderRadius: 18,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    width: "78%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 2,
  },
  actions: {
    flexDirection: "row",
    marginTop: 18,
    gap: 8,
    width: "100%",
  },
  actionsSingle: {
    justifyContent: "center",
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    backgroundColor: "#F3F4F6",
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  btnConfirm: {
    // backgroundColor set dynamically
  },
  btnConfirmText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});
