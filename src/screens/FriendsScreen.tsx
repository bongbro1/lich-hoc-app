import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  InteractionManager,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import FriendItem from "../components/FriendItem";
import { AppScrollView } from "../components/AppScrollView";
import SimpleHeader from "../components/SimpleHeader";
import { useRefresh } from "../contexts/RefreshContext";
import { useUser } from "../contexts/UserContext";
import { friendRepo } from "../repositories/friendRepo";
import { userRepo } from "../repositories/userRepo";
import * as RootNavigation from "../navigation/RootNavigation";
import { FriendRequestModel } from "../models/friend";
import { useFriendVM } from "../viewmodels/useFriendVM";
import { Friend } from "../types/friend";
import { Colors } from "../utils/theme";

type TabProps = {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
};

type IncomingFriend = Friend & {
  requestId: string;
};

export default function FriendsScreen() {
  const { register } = useRefresh();
  const { user, darkMode } = useUser();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<IncomingFriend[]>([]);
  const [blocked, setBlocked] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "blocked">(
    "friends"
  );
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingBlocked, setLoadingBlocked] = useState(true);

  const {
    incomingRequests,
    friendIds,
    blockedIds,
    listenRequests,
    listenFriends,
    listenBlocked,
    accept,
    reject,
    unfriend,
    blockUser,
    unblockUser,
  } = useFriendVM();

  const closeMenu = () => setMenuUserId(null);

  const mapIdsToFriends = async (ids: string[]) => {
    if (!user?.studentId || ids.length === 0) {
      return [];
    }
    const pStart = Date.now();
    const profiles = await userRepo.getUsersByIds(ids);
    const mStart = Date.now();
    const result = await Promise.all(
      profiles.map(async (profile) => ({
        studentId: profile.studentId,
        name: profile.name,
        major: profile.major ?? null,
        className: profile.className ?? null,
        avatar: profile.avatar ?? null,
        online: profile.online,
        onlineStatus: profile.onlineStatus,
        mutualCount: await friendRepo.getMutualFriendCount(
          user.studentId,
          profile.studentId,
          ids // This is the list of current user's friends
        ),
      }))
    );
    return result;
  };

  const mapRequestsToFriends = async (items: FriendRequestModel[]) => {
    if (!user?.studentId || items.length === 0) {
      return [];
    }

    const profiles = await userRepo.getUsersByIds(
      items.map((item) => item.fromStudentId)
    );

    return Promise.all(
      items.map(async (item) => {
        const profile = profiles.find(
          (candidate) => candidate.studentId === item.fromStudentId
        );

        return {
          requestId: item.id,
          studentId: item.fromStudentId,
          name: profile?.name ?? item.fromStudentId,
          major: profile?.major ?? null,
          className: profile?.className ?? null,
          avatar: profile?.avatar ?? null,
          online: profile?.online ?? false,
          onlineStatus: profile?.onlineStatus,
          mutualCount: await friendRepo.getMutualFriendCount(
            user.studentId,
            item.fromStudentId
          ),
        };
      })
    );
  };

  useEffect(() => {
    if (!user?.studentId) return;

    const unsubscribers = [
      listenFriends(user.studentId),
      listenRequests(user.studentId),
      listenBlocked(user.studentId),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [user?.studentId, listenBlocked, listenFriends, listenRequests]);

  useEffect(() => {
    let mounted = true;
    setLoadingFriends(true);

    const task = InteractionManager.runAfterInteractions(() => {
      void mapIdsToFriends(friendIds).then((items) => {
        if (mounted) {
          setFriends(items);
          setLoadingFriends(false);
        }
      });
    });

    return () => {
      mounted = false;
      task.cancel();
    };
  }, [friendIds, user?.studentId]);

  useEffect(() => {
    let mounted = true;
    setLoadingRequests(true);

    const task = InteractionManager.runAfterInteractions(() => {
      void mapRequestsToFriends(incomingRequests).then((items) => {
        if (mounted) {
          setRequests(items);
          setLoadingRequests(false);
        }
      });
    });

    return () => {
      mounted = false;
      task.cancel();
    };
  }, [incomingRequests, user?.studentId]);

  useEffect(() => {
    let mounted = true;
    setLoadingBlocked(true);

    const task = InteractionManager.runAfterInteractions(() => {
      void mapIdsToFriends(blockedIds).then((items) => {
        if (mounted) {
          setBlocked(items);
          setLoadingBlocked(false);
        }
      });
    });

    return () => {
      mounted = false;
      task.cancel();
    };
  }, [blockedIds, user?.studentId]);

  const reload = async () => {
    setFriends(await mapIdsToFriends(friendIds));
    setRequests(await mapRequestsToFriends(incomingRequests));
    setBlocked(await mapIdsToFriends(blockedIds));
  };

  useEffect(() => register(reload), [register, friendIds, incomingRequests, blockedIds]);

  const normalizedKeyword = searchText.trim().toLowerCase();
  const matchesKeyword = (item: Friend) => {
    if (!normalizedKeyword) return true;

    return (
      item.name.toLowerCase().includes(normalizedKeyword) ||
      (item.className ?? "").toLowerCase().includes(normalizedKeyword)
    );
  };

  const visibleFriends = friends.filter(matchesKeyword);
  const visibleRequests = requests.filter(matchesKeyword);
  const visibleBlocked = blocked.filter(matchesKeyword);

  const handleOpenMenu = (item: Friend, pos: { x: number; y: number }) => {
    setMenuUserId(item.studentId);
    setMenuPos(pos);
  };

  const theme = {
    bg: darkMode ? '#0F172A' : '#F8FAFC',
    card: darkMode ? '#1E293B' : '#FFFFFF',
    text: darkMode ? '#F8FAFC' : '#1E293B',
    textMuted: darkMode ? '#94A3B8' : '#64748B',
    border: darkMode ? '#334155' : '#F1F5F9',
    input: darkMode ? '#334155' : '#F1F5F9',
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppScrollView>
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
          <SimpleHeader title="Bạn bè" />

          {/* Search Box */}
          <View style={[styles.searchWrapper, { backgroundColor: theme.card }]}>
            <View style={[styles.searchContainer, { backgroundColor: theme.input }]}>
              <Icon name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
              <TextInput
                placeholder="Tìm bạn bè..."
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <Pressable onPress={() => setSearchText("")} hitSlop={10} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
                  <Icon name="x-circle" size={18} color={theme.textMuted} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Tab Controls */}
          <View style={[styles.tabContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <View style={[styles.tabRow, { backgroundColor: theme.input }]}>
              <TabButton
                label="Bạn bè"
                active={activeTab === "friends"}
                onPress={() => setActiveTab("friends")}
                darkMode={darkMode}
              />
              <TabButton
                label="Lời mời"
                count={incomingRequests.length}
                active={activeTab === "requests"}
                onPress={() => setActiveTab("requests")}
                darkMode={darkMode}
              />
              <TabButton
                label="Đã chặn"
                active={activeTab === "blocked"}
                onPress={() => setActiveTab("blocked")}
                darkMode={darkMode}
              />
            </View>
          </View>

          {/* Content Lists */}
          <View style={styles.listContainer}>
            {activeTab === "friends" && (
              loadingFriends ? <FriendListSkeleton /> : (
                <FriendsList
                  friends={visibleFriends}
                  onToggleMenu={handleOpenMenu}
                />
              )
            )}

            {activeTab === "requests" && (
              loadingRequests ? <FriendListSkeleton /> : (
                <FriendRequests
                  requests={visibleRequests}
                  darkMode={darkMode}
                  onAccept={async (item) => {
                    if (!user?.studentId) return;
                    await accept(item.requestId, item.studentId, user.studentId, user.name);
                  }}
                  onReject={async (item) => {
                    if (!user?.studentId) return;
                    await reject(item.requestId, item.studentId, user.studentId);
                  }}
                />
              )
            )}

            {activeTab === "blocked" && (
              loadingBlocked ? <FriendListSkeleton /> : (
                <BlockedList
                  blocked={visibleBlocked}
                  darkMode={darkMode}
                  onUnblock={async (item) => {
                    if (!user?.studentId) return;
                    await unblockUser(user.studentId, item.studentId);
                  }}
                />
              )
            )}
          </View>
        </View>
      </AppScrollView>

      {menuUserId && <Pressable style={styles.overlay} onPress={closeMenu} />}

      {menuUserId && menuPos && (
        <View
          style={[
            styles.optionMenuInline,
            {
              backgroundColor: theme.card,
              top: menuPos?.y || 0,
              left: Math.max(16, Math.min(Dimensions.get('window').width - 216, menuPos?.x || 0))
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [styles.optionItem, { backgroundColor: pressed ? (darkMode ? '#334155' : '#F1F5F9') : 'transparent' }]}
            onPress={() => {
              RootNavigation.navigate("ProfileFeedScreen", { studentId: menuUserId });
              closeMenu();
            }}
          >
            <Icon name="user" size={18} color={theme.textMuted} style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: theme.text }]}>Xem trang cá nhân</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.optionItem, { backgroundColor: pressed ? (darkMode ? '#334155' : '#F1F5F9') : 'transparent' }]}
            onPress={async () => {
              if (menuUserId) {
                await unfriend(user!.studentId, menuUserId);
                closeMenu();
              }
            }}
          >
            <Icon name="user-minus" size={18} color="#F59E0B" style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: "#F59E0B" }]}>Hủy kết bạn</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.optionItem, { backgroundColor: pressed ? (darkMode ? '#334155' : '#F1F5F9') : 'transparent' }]}
            onPress={async () => {
              if (menuUserId) {
                await blockUser(user!.studentId, menuUserId);
                closeMenu();
              }
            }}
          >
            <Icon name="slash" size={18} color="#EF4444" style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: "#EF4444" }]}>Chặn người này</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// -------------------------------------------------------------
// FRIENDS LIST
// -------------------------------------------------------------
type FriendsListProps = {
  friends: Friend[];
  onToggleMenu: (item: Friend, pos: { x: number; y: number }) => void;
};

function FriendsList({
  friends,
  onToggleMenu,
}: FriendsListProps) {
  const handleViewProfile = (item: Friend) => {
    RootNavigation.navigate("ProfileFeedScreen", {
      studentId: item.studentId,
    });
  };

  if (friends.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBg}>
          <Icon name="users" size={40} color="#94A3B8" />
        </View>
        <Text style={styles.emptyText}>Chưa có bạn bè nào</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {friends.map((item) => (
        <FriendItem
          key={item.studentId}
          user={item}
          onToggleMenu={(pos) => onToggleMenu(item, pos)}
          onViewProfile={() => handleViewProfile(item)}
        />
      ))}
    </ScrollView>
  );
}

// -------------------------------------------------------------
// FRIEND REQUESTS
// -------------------------------------------------------------
type FriendRequestsProps = {
  requests: IncomingFriend[];
  darkMode: boolean;
  onAccept: (item: IncomingFriend) => Promise<void>;
  onReject: (item: IncomingFriend) => Promise<void>;
};

function FriendRequests({ requests, darkMode, onAccept, onReject }: FriendRequestsProps) {
  if (requests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBg}>
          <Icon name="user-plus" size={40} color="#94A3B8" />
        </View>
        <Text style={styles.emptyText}>Không có lời mời kết bạn nào</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {requests.map((item) => {
        const theme = {
          card: darkMode ? '#1E293B' : '#FFFFFF',
          text: darkMode ? '#F8FAFC' : '#1E293B',
          textMuted: darkMode ? '#94A3B8' : '#64748B',
          input: darkMode ? '#334155' : '#F1F5F9',
        };
        return (
          <View key={item.requestId} style={[styles.card, { backgroundColor: theme.card }]}>
            <Pressable
              onPress={() => RootNavigation.navigate("ProfileFeedScreen", { studentId: item.studentId })}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.userRow}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: item.avatar ?? "" }} style={[styles.avatar, { backgroundColor: theme.input }]} />
                </View>

                <View style={styles.userInfo}>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1}>{item.className}</Text>
                  {item.mutualCount > 0 && (
                    <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1}>{item.mutualCount} bạn chung</Text>
                  )}
                </View>
              </View>
            </Pressable>

            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.acceptBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                onPress={() => void onAccept(item)}
              >
                <Text style={styles.acceptText}>Chấp nhận</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.rejectBtn, { backgroundColor: theme.input, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                onPress={() => void onReject(item)}
              >
                <Text style={[styles.rejectText, { color: theme.text }]}>Từ chối</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// -------------------------------------------------------------
// BLOCKED LIST
// -------------------------------------------------------------
type BlockedListProps = {
  blocked: Friend[];
  darkMode: boolean;
  onUnblock: (item: Friend) => Promise<void>;
};

function BlockedList({ blocked, darkMode, onUnblock }: BlockedListProps) {
  if (blocked.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBg}>
          <Icon name="user-x" size={40} color="#94A3B8" />
        </View>
        <Text style={styles.emptyText}>Không có người bị chặn</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {blocked.map((item) => {
        const theme = {
          card: darkMode ? '#1E293B' : '#FFFFFF',
          text: darkMode ? '#F8FAFC' : '#1E293B',
          textMuted: darkMode ? '#94A3B8' : '#64748B',
          input: darkMode ? '#334155' : '#F1F5F9',
        };
        return (
          <View key={item.studentId} style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.userRow}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: item.avatar ?? "" }} style={[styles.avatar, { backgroundColor: theme.input }]} />
                {item.online && <View style={[styles.onlineDot, { borderColor: theme.card }]} />}
              </View>

              <View style={styles.userInfo}>
                <Text
                  style={[styles.name, { color: theme.text }]}
                  numberOfLines={1}
                  onPress={() => RootNavigation.navigate("ProfileFeedScreen", { studentId: item.studentId })}
                >
                  {item.name}
                </Text>
                <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1}>{item.className}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.unblockBtn, { backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', transform: [{ scale: pressed ? 0.96 : 1 }] }]}
              onPress={() => void onUnblock(item)}
            >
              <Text style={styles.unblockText}>Bỏ chặn</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

// -------------------------------------------------------------
// TAB BUTTON
// -------------------------------------------------------------
export function TabButton({ label, count, active, onPress, darkMode }: TabProps & { darkMode: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tabBtn, active && [styles.tabBtnActive, { backgroundColor: darkMode ? '#1E293B' : '#FFFFFF' }], { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
      <Text style={[styles.tabText, active && styles.tabTextActive, !active && darkMode && { color: '#94A3B8' }]}>
        {label} {count ? `(${count})` : ""}
      </Text>
    </Pressable>
  );
}

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
// -------------------------------------------------------------
// SKELETON
// -------------------------------------------------------------
function FriendSkeletonItem() {
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
    <View style={styles.skeletonCard}>
      <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
      <View style={styles.skeletonInfo}>
        <Animated.View style={[styles.skeletonName, { opacity }]} />
        <Animated.View style={[styles.skeletonSub, { opacity }]} />
      </View>
      <Animated.View style={[styles.skeletonMenu, { opacity }]} />
    </View>
  );
}

function FriendListSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <FriendSkeletonItem key={i} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Light gray background
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
  },
  tabContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  listContainer: {
    flex: 1,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: "#10B981",
    borderRadius: 7,
    position: "absolute",
    bottom: 2,
    right: 2,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  name: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sub: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
  },
  rejectBtn: {
    backgroundColor: "#F1F5F9",
  },
  acceptText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  rejectText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 14,
  },
  unblockBtn: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FEF2F2", // Light red
    alignItems: "center",
  },
  unblockText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  optionMenuInline: {
    position: "absolute",
    width: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20,
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
  },
  // Skeleton Styles
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E2E8F0",
  },
  skeletonInfo: {
    flex: 1,
    marginLeft: 16,
  },
  skeletonName: {
    width: "60%",
    height: 20,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
    marginBottom: 8,
  },
  skeletonSub: {
    width: "40%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonMenu: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
});
