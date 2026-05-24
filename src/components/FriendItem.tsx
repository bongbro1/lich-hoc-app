import React, { useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { Colors } from "../utils/theme";
import { Friend } from "../types/friend";
import { useUser } from "../contexts/UserContext";

type FriendItemProps = {
  user: Friend;
  onToggleMenu: (pos: { x: number; y: number }) => void;
  onViewProfile: () => void;
};

export default function FriendItem({
  user,
  onToggleMenu,
  onViewProfile,
}: FriendItemProps) {
  const menuRef = useRef<View>(null);

  const { darkMode } = useUser();
  const theme = {
    card: darkMode ? '#1E293B' : '#FFFFFF',
    text: darkMode ? '#F8FAFC' : '#1E293B',
    textMuted: darkMode ? '#94A3B8' : '#64748B',
    input: darkMode ? '#334155' : '#F1F5F9',
    btn: darkMode ? '#334155' : '#F8FAFC',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onViewProfile}
      style={[styles.card, { backgroundColor: theme.card }]}
    >
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: user.avatar ?? "" }} style={[styles.avatar, { backgroundColor: theme.input }]} />
        {user.online && <View style={[styles.onlineDot, { borderColor: theme.card }]} />}
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

      {/* Menu Icon */}
      <TouchableOpacity
        activeOpacity={0.6}
        style={[styles.menuButton, { backgroundColor: theme.btn }]}
        onPress={() => {
          menuRef.current?.measureInWindow((x, y, width, height) => {
            onToggleMenu({
              x: x + width - 180,
              y: y + height + 40,
            });
          });
        }}
        ref={menuRef}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="more-horizontal" size={20} color={theme.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2, // For Android
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1F5F9",
  },
  onlineDot: {
    width: 14,
    height: 14,
    backgroundColor: "#10B981", // Success green
    borderRadius: 7,
    position: "absolute",
    bottom: 2,
    right: 2,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  info: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  mutual: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
});
