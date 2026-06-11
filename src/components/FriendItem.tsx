import React, { useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { Friend } from "../types/friend";
import { useUser } from "../contexts/UserContext";
import { Colors } from "utils/theme";

type FriendItemProps = {
  user: Friend;
  onToggleMenu: (pos: { x: number; y: number }) => void;
  onViewProfile: () => void;
  onChatPress?: () => void;
  isMenuActive?: boolean;
};

export default function FriendItem({
  user,
  onToggleMenu,
  onViewProfile,
  onChatPress,
  isMenuActive = false,
}: FriendItemProps) {
  const menuRef = useRef<View>(null);

  const { darkMode } = useUser();
  const theme = {
    text: darkMode ? '#F8FAFC' : '#191B24', // on-surface
    textMuted: darkMode ? '#94A3B8' : '#424656', // on-surface-variant
    buttonBg: darkMode ? '#334155' : '#E1E2EE',
    buttonPressedBg: darkMode ? '#475569' : '#C2C6D8',
    activeButtonBg: Colors.primary,
    border: darkMode ? '#1E293B' : '#F0F2F5', // Soft divider line color
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onViewProfile}
      style={[styles.card, { borderBottomColor: theme.border }]}
    >
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: user.avatar ?? "" }} style={[styles.avatar, { backgroundColor: darkMode ? '#334155' : '#F1F5F9' }]} />
        {user.online && <View style={[styles.onlineDot, { borderColor: darkMode ? '#0F172A' : '#fff', backgroundColor: '#10B981' }]} />}
      </View>

      {/* Info Section */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={[styles.mutual, { color: theme.textMuted }]} numberOfLines={1}>
          {user.mutualCount} bạn chung
        </Text>
      </View>

      {/* Action Buttons Container */}
      <View style={styles.actions}>
        {onChatPress && (
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: pressed ? theme.buttonPressedBg : theme.buttonBg }
            ]}
            onPress={onChatPress}
          >
            <Icon name="message-square" size={18} color={darkMode ? '#F8FAFC' : '#5C5F61'} />
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: isMenuActive
                ? theme.activeButtonBg
                : (pressed ? theme.buttonPressedBg : theme.buttonBg)
            }
          ]}
          onPress={() => {
            menuRef.current?.measureInWindow((x, y, width, height) => {
              onToggleMenu({
                x: x + width - 180,
                y: y + height + 35,
              });
            });
          }}
          ref={menuRef}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon
            name="more-horizontal"
            size={18}
            color={isMenuActive ? '#FFFFFF' : (darkMode ? '#F8FAFC' : '#5C5F61')}
          />
        </Pressable>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.8,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
  info: {
    flex: 1,
    marginLeft: 12, // gap-3 is 12px
    justifyContent: "center",
  },
  name: {
    fontSize: 17, // headline-sm is 17px
    fontWeight: "600",
    lineHeight: 24,
    marginBottom: 2,
  },
  mutual: {
    fontSize: 13, // label-lg is 13px
    fontWeight: "400",
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4, // gap-1 in Tailwind is 4px
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
