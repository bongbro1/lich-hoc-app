import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../utils/theme";
import { useUser } from "contexts/UserContext";

const { height } = Dimensions.get("window");

export type BottomAction = {
  label: string;
  onPress: () => void;
  color?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

type BottomActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions?: BottomAction[];
  children?: React.ReactNode;
};

export default function BottomActionSheet({
  visible,
  onClose,
  title = "Hành động",
  actions = [],
  children,
}: BottomActionSheetProps) {
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(visible);

  // Animation values
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: height,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  const { darkMode } = useUser();
  const theme = {
    bg: darkMode ? '#1E293B' : '#FFFFFF',
    text: darkMode ? '#F8FAFC' : '#1E293B',
    textMuted: darkMode ? '#94A3B8' : '#64748B',
    border: darkMode ? '#334155' : '#F1F5F9',
    itemBg: darkMode ? '#334155' : '#F8FAFC',
    handle: darkMode ? '#475569' : '#E2E8F0',
  };

  if (!showModal && !visible) return null;

  return (
    <Modal
      transparent
      visible={showModal}
      onRequestClose={handleClose}
      statusBarTranslucent
      animationType="none"
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { opacity }
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        {/* Sheet Content */}
        <Animated.View style={[
          styles.sheet,
          {
            backgroundColor: theme.bg,
            paddingBottom: insets.bottom + 20,
            transform: [{ translateY }]
          }
        ]}>
          {/* Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.handle }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.textMuted }]}>{title}</Text>
          </View>

          {/* Actions List */}
          <View style={styles.content}>
            {children && <View style={{ marginBottom: 16 }}>{children}</View>}
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionItem, { backgroundColor: theme.itemBg }]}
                activeOpacity={0.7}
                onPress={() => {
                  action.onPress();
                  handleClose();
                }}
              >
                <View style={[
                  styles.iconCircle,
                  { backgroundColor: action.color ? `${action.color}15` : `${Colors.primary}10` }
                ]}>
                  <MaterialIcons
                    name={action.icon || 'star-border'}
                    size={18}
                    color={action.color || Colors.primary}
                  />
                </View>

                <Text
                  style={[
                    styles.actionLabel,
                    { color: theme.text },
                    action.color && { color: action.color },
                  ]}
                >
                  {action.label}
                </Text>

                <MaterialIcons name="chevron-right" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Integrated Close Button */}
          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={0.8}
            style={styles.closeButton}
          >
            <Text style={[styles.closeText, { color: '#EF4444' }]}>Đóng</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 15,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  content: {
    marginBottom: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 6,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  closeButton: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 0,
    marginTop: 2,
    backgroundColor: '#FEF2F2',
  },
  closeText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
