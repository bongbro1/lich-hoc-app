import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
  Pressable,
  Animated,
  TouchableWithoutFeedback,
  Modal,
  InteractionManager,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import SimpleHeader from "../components/SimpleHeader";
import { useAlert } from "../contexts/AlertContext";
import { useImageFullModal } from "../contexts/ImageFullModalContext";
import * as RootNavigation from "../navigation/RootNavigation";
import { useUser } from "../contexts/UserContext";
import { UserModel } from "../models/user";
import { userRepo } from "../repositories/userRepo";
import { getPosition } from "../services/locationService";
import storageService, { STORAGE_KEYS } from "../services/storageService";
import { Friend_Near } from "../types/typesChat";
import { Colors } from "../utils/theme";

const { width } = Dimensions.get('window');


export default function FriendsNearbyScreen() {
  const { showAlert } = useAlert();
  const { openModal } = useImageFullModal();
  const [friends, setFriends] = useState<Friend_Near[]>([]);
  const [searchText, setSearchText] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Friend_Near | null>(null);
  const [currentUser, setCurrentUser] = useState<UserModel | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = async () => {
    const user = await storageService.get({ key: STORAGE_KEYS.USER });
    setCurrentUser(user);
    return user;
  };

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const storedUser = await loadCurrentUser();

      if (!storedUser?.studentId) {
        setFriends([]);
        return;
      }

      let lat = storedUser.lat;
      let lng = storedUser.lng;

      const position = await getPosition();
      if (typeof position.lat === "number" && typeof position.lng === "number") {
        lat = position.lat;
        lng = position.lng;

        const nextUser = {
          ...storedUser,
          lat,
          lng,
        };

        await userRepo.addUserIfNotExists({
          studentId: nextUser.studentId,
          name: nextUser.name,
          className: nextUser.className,
          schoolName: nextUser.schoolName,
          major: nextUser.major,
          avatar: nextUser.avatar ?? null,
          lat,
          lng,
        });

        await storageService.set({
          key: STORAGE_KEYS.USER,
          value: nextUser,
        });

        setCurrentUser(nextUser);
      }

      if (typeof lat !== "number" || typeof lng !== "number") {
        setFriends([]);
        return;
      }

      const nearbyUsers = await userRepo.getNearbyUsers({
        currentUserId: storedUser.studentId,
        lat,
        lng,
      });

      setFriends(nearbyUsers);
    } catch (error) {
      showAlert({
        type: "error",
        title: "Thông báo",
        message: "Lấy danh sách thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void fetchFriends();
    });
    return () => task.cancel();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFriends();
    setRefreshing(false);
  };

  const filteredFriends = friends.filter((friend) => {
    const keyword = searchText.toLowerCase();
    return (
      friend.name.toLowerCase().includes(keyword) ||
      (friend.className ?? "").toLowerCase().includes(keyword)
    );
  });

  const handleGoProfile = () => {
    if (!selectedUser) return;
    setPopupVisible(false);
    RootNavigation.navigate("ProfileFeedScreen", {
      studentId: selectedUser.studentId,
      studentName: selectedUser.name,
      avatarUri: selectedUser.avatar,
      major: selectedUser.className,
    });
  };

  const { darkMode } = useUser();
  const theme = {
    bg: darkMode ? '#0F172A' : '#F5F7FB',
    card: darkMode ? '#1E293B' : '#FFFFFF',
    text: darkMode ? '#F8FAFC' : Colors.text,
    textMuted: darkMode ? '#94A3B8' : Colors.subText,
    border: darkMode ? '#334155' : '#F1F5F9',
    input: darkMode ? '#334155' : '#F1F5F9',
    badge: darkMode ? 'rgba(20, 184, 166, 0.15)' : '#F0FDFA',
  };

  const renderFriend = ({ item }: { item: Friend_Near }) => (
    <Pressable
      onPress={() => {
        setSelectedUser(item);
        setPopupVisible(true);
      }}
      style={({ pressed }) => [
        styles.friendCard,
        { backgroundColor: pressed ? (darkMode ? '#334155' : '#F1F5F9') : theme.card }
      ]}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: item.avatar ?? '' }}
          style={[styles.avatar, { backgroundColor: theme.input }]}
        />
        {item.online && <View style={[styles.statusDot, { borderColor: theme.card }]} />}
      </View>

      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.friendSub, { color: theme.textMuted }]} numberOfLines={1}>
          {item.className}
        </Text>
        <View style={[styles.distanceBadge, { backgroundColor: theme.badge }]}>
          <Icon name="location-on" size={12} color={Colors.primary} />
          <Text style={styles.distanceText}>{item.distance}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.actionIcon, { backgroundColor: theme.badge }]}
        activeOpacity={0.7}
        onPress={() =>
          RootNavigation.navigate("Chats", {
            screen: "ChatDetailScreen",
            params: { user: item, currentUser },
          })
        }
      >
        <Icon name="chat-bubble-outline" size={22} color={Colors.primary} />
      </TouchableOpacity>
    </Pressable>
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <SimpleHeader title="Bạn bè quanh đây" />

      <View style={styles.content}>
        <View style={[styles.searchWrapper, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={[styles.searchContainer, { backgroundColor: theme.input }]}>
            <Icon name="search" size={20} color={theme.textMuted} />
            <TextInput
              placeholder="Tìm bạn theo tên hoặc lớp..."
              placeholderTextColor={theme.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="cancel" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.listContent}>
            {Array.from({ length: 6 }).map((_, i) => (
              <NearbyFriendSkeleton key={i} />
            ))}
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.studentId}
            renderItem={renderFriend}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBg}>
                  <Icon name="people-outline" size={48} color="#CBD5E1" />
                </View>
                <Text style={styles.emptyText}>Không tìm thấy bạn bè nào quanh đây</Text>
                <Text style={styles.emptySubText}>Hãy thử làm mới hoặc tìm kiếm tên khác</Text>
              </View>
            }
          />
        )}
      </View>
      <UserDetailModal
        visible={popupVisible}
        user={selectedUser}
        onClose={() => setPopupVisible(false)}
        onGoProfile={handleGoProfile}
        onMessage={() => {
          setPopupVisible(false);
          RootNavigation.navigate("Chats", {
            screen: "ChatDetailScreen",
            params: { user: selectedUser, currentUser },
          });
        }}
      />
    </View>
  );
}

function NearbyFriendSkeleton() {
  const { darkMode } = useUser();
  const theme = {
    card: darkMode ? '#1E293B' : '#FFFFFF',
    input: darkMode ? '#334155' : '#E2E8F0',
  };
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.7],
  });

  return (
    <View style={[styles.friendCard, { backgroundColor: theme.card }]}>
      <Animated.View style={[styles.avatar, { opacity, backgroundColor: theme.input }]} />
      <View style={styles.friendInfo}>
        <Animated.View style={[styles.skeletonText, { width: '60%', opacity, backgroundColor: theme.input }]} />
        <Animated.View style={[styles.skeletonText, { width: '40%', opacity, marginTop: 10, backgroundColor: theme.input }]} />
        <Animated.View style={[styles.skeletonText, { width: '30%', height: 12, opacity, marginTop: 10, backgroundColor: theme.input }]} />
      </View>
      <Animated.View style={[styles.skeletonIcon, { opacity, backgroundColor: theme.input }]} />
    </View>
  );
}

function UserDetailModal({
  visible,
  user,
  onClose,
  onGoProfile,
  onMessage,
}: {
  visible: boolean;
  user: Friend_Near | null;
  onClose: () => void;
  onGoProfile: () => void;
  onMessage: () => void;
}) {
  const { darkMode } = useUser();
  const { openModal } = useImageFullModal();
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 150, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const theme = {
    card: darkMode ? '#1E293B' : '#fff',
    text: darkMode ? '#F8FAFC' : Colors.text,
    textMuted: darkMode ? '#94A3B8' : Colors.subText,
    border: darkMode ? '#334155' : '#F1F5F9',
    box: darkMode ? '#334155' : '#F8FAFC',
    overlay: 'rgba(0,0,0,0.45)',
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[styles.modalOverlay, { opacity: fadeAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContent,
            { backgroundColor: theme.card, transform: [{ scale: scaleAnim }], opacity: fadeAnim },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.text }]}>{user.name}</Text>

          <View style={styles.popupContent}>
            <TouchableOpacity
              onPress={() => user.avatar && openModal(user.avatar)}
              activeOpacity={0.9}
              style={styles.popupAvatarWrapper}
            >
              <View>
                <Image
                  source={{ uri: user.avatar ?? '' }}
                  style={[styles.popupAvatar, { borderColor: theme.border }]}
                />
                {user.online && <View style={[styles.popupStatusDot, { borderColor: theme.card }]} />}
              </View>
            </TouchableOpacity>

            <View style={[styles.popupInfoBox, { backgroundColor: theme.box }]}>
              <View style={styles.popupInfoRow}>
                <Icon name="school" size={16} color={theme.textMuted} />
                <Text style={[styles.popupInfoText, { color: theme.textMuted }]}>Lớp: {user.className}</Text>
              </View>
              <View style={styles.popupInfoRow}>
                <Icon name="near-me" size={16} color={theme.textMuted} />
                <Text style={[styles.popupInfoText, { color: theme.textMuted }]}>Khoảng cách: {user.distance}</Text>
              </View>
            </View>

            <View style={styles.popupActions}>
              <TouchableOpacity activeOpacity={0.98}
                style={[styles.popupBtn, styles.popupBtnOutline, { backgroundColor: darkMode ? 'transparent' : '#FFF' }]}
                onPress={onGoProfile}
              >
                <Icon name="person-outline" size={20} color={Colors.primary} />
                <Text style={styles.popupBtnTextOutline}>Hồ sơ</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.98}
                style={[styles.popupBtn, styles.popupBtnPrimary]}
                onPress={onMessage}
              >
                <Icon name="chat-bubble" size={20} color="#FFF" />
                <Text style={styles.popupBtnTextPrimary}>Nhắn tin</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.modalCloseX} onPress={onClose}>
            <Icon name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}



const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 15,
    color: "#1E293B",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 12,
    height: 12,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    position: "absolute",
    bottom: 1,
    right: 1,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  skeletonText: {
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  skeletonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 16,
  },
  friendName: {
    fontWeight: "700",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
  },
  friendSub: {
    color: "#64748B",
    fontSize: 13,
    marginBottom: 6,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  distanceText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionIcon: {
    padding: 10,
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: "#475569",
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalCloseX: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  popupContent: {
    width: '100%',
    alignItems: "center",
  },
  popupAvatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  popupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#F1F5F9',
  },
  popupStatusDot: {
    width: 16,
    height: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    position: "absolute",
    bottom: 2,
    right: 2,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  popupInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  popupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  popupInfoText: {
    fontSize: 14,
    color: "#475569",
    marginLeft: 10,
    fontWeight: '500',
  },
  popupActions: {
    flexDirection: "row",
    width: '100%',
    gap: 12,
  },
  popupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  popupBtnOutline: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  popupBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  popupBtnTextOutline: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  popupBtnTextPrimary: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});