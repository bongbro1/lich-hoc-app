// ChatTab.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Modal, Dimensions, Pressable } from 'react-native';
import SimpleHeader from '../components/SimpleHeader';
import { formatTime } from '../utils/date';
import { useAlert } from '../contexts/AlertContext';
import { useUser } from '../contexts/UserContext';
import { Colors } from '../utils/theme';
import BottomActionSheet from '../components/BottomActionSheet';
import { useConversationVM } from 'viewmodels/useConversationVM';
import { Conversation } from 'types/chat.types';
import { SCREENS } from 'configs/constants';

type Props = {
  navigation: any;
};
export const ChatScreen = ({ navigation }: Props) => {

  const { user, darkMode } = useUser();
  const {
    conversations,
    loadConversations,
    markConversationSeen,
    markConversationAsUnread,
    removeConversation,
    loading,
  } = useConversationVM(user?.studentId);

  const [selectedItem, setSelectedItem] = useState<Conversation | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (!user?.studentId) return;
    loadConversations();
  }, [user?.studentId, loadConversations]);

  const onRefresh = async () => {
    if (!user?.studentId) return;
    await loadConversations();
  };

  const theme = {
    bg: darkMode ? '#0F172A' : '#FFFFFF',
    text: darkMode ? '#F8FAFC' : Colors.text,
    textSecondary: darkMode ? '#94A3B8' : '#888',
    border: darkMode ? '#1E293B' : '#eee',
    unread: darkMode ? '#F8FAFC' : '#000',
  };

  const handleDeleteConversation = async (item: Conversation) => {
    const success = await removeConversation(item.id);

    if (!success) {
      showAlert({
        type: "info",
        title: "Thông báo",
        message: "Xóa thất bại",
      });
      return;
    }

    setModalVisible(false);

    showAlert({
      type: "success",
      title: "Thành công",
      message: "Đã xóa hội thoại.",
    });
  };

  const handleMarkUnread = async (item: Conversation) => {
    await markConversationAsUnread(item.id);
    setModalVisible(false);
  };

  const handleOpenConversation = async (item: Conversation) => {
    await markConversationSeen(item.id);

    navigation.navigate("ChatDetailScreen", {
      user: item.user,
      conversationId: item.id,
    });
  };

  const chatActions = useMemo(() => {
    if (!selectedItem) return [];

    return [
      {
        label: "Xem trang cá nhân",
        icon: "person-outline" as any,
        onPress: () => {
          navigation.navigate(SCREENS.DASHBOARD, {
            screen: SCREENS.PROFILE_FEED,
            params: { studentId: selectedItem.user.studentId },
          });
        },
      },
      {
        label: "Lưu trữ",
        icon: "archive" as any,
        onPress: () => console.log("Archive"),
      },
      {
        label: "Tắt thông báo",
        icon: "notifications-off" as any,
        onPress: () => console.log("Mute"),
      },
      {
        label: selectedItem.hasUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc",
        icon: (selectedItem.hasUnread ? "mark-email-read" : "mark-email-unread") as any,
        onPress: () => {
          if (selectedItem.hasUnread) {
            markConversationSeen(selectedItem.id);
          } else {
            markConversationAsUnread(selectedItem.id);
          }
        },
      },
      {
        label: "Hạn chế",
        icon: "person-off" as any,
        onPress: () => console.log("Restrict"),
      },
      {
        label: "Chặn",
        icon: "block" as any,
        color: "#FF3B30",
        onPress: () => console.log("Block"),
      },
      {
        label: "Xóa cuộc trò chuyện",
        icon: "delete-outline" as any,
        color: "#FF3B30",
        onPress: () => handleDeleteConversation(selectedItem),
      },
    ];
  }, [selectedItem, navigation, markConversationSeen, markConversationAsUnread, handleDeleteConversation]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SimpleHeader title="Tin nhắn" showBackButton={false} />

      <FlatList
        contentContainerStyle={{ flexGrow: 1 }}
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.conversationItem, { borderBottomColor: theme.border }]}
            onPress={() => handleOpenConversation(item)}
            onLongPress={() => {
              setSelectedItem(item);
              setModalVisible(true);
            }}
            delayLongPress={250}
            activeOpacity={1}
          >
            <View>
              <Image source={{ uri: item.user.avatar ?? '' }} style={styles.avatar} />
              {item.user.online && <View style={[styles.onlineDot, { borderColor: theme.bg }]} />}
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.userName, { color: theme.text }]}>{item.user.name}</Text>

              <Text
                style={[
                  styles.lastMessage,
                  {
                    fontWeight: item.hasUnread ? "600" : "400",
                    color: item.hasUnread ? theme.unread : theme.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {item.lastMessageSenderId === user?.studentId
                  ? `Bạn: ${item.lastMessage}`
                  : item.lastMessage}
                <Text style={[styles.timestamp, { color: theme.textSecondary }]}>  · {formatTime(item.timestamp)}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        )}
        refreshing={loading}
        onRefresh={onRefresh}
        ListEmptyComponent={() => <ListEmptyComponent navigation={navigation} />}
      />

      <BottomActionSheet
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedItem?.user?.name || "Tuỳ chọn"}
        actions={chatActions}
      />
    </View>
  );
};

const ListEmptyComponent = ({ navigation }: { navigation: any }) => {
  const { darkMode } = useUser();
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        backgroundColor: darkMode ? '#0F172A' : "#fefbf3",
      }}
    >
      <View
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setImageLayout({ width, height });
        }}
        style={{ width: "100%", alignItems: "center" }}
      >
        <Image
          source={require("./../../assets/not_found.png")}
          style={{ width: "100%", height: undefined, aspectRatio: 1 }} // giữ tỷ lệ 1:1
          resizeMode="contain"
        />

        {imageLayout.width > 0 && (
          <TouchableOpacity
            onPress={() =>
              navigation.getParent()?.navigate("Dashboard", {
                screen: "FriendsNearbyScreen",
              })
            }
            style={{
              position: "absolute",
              top: imageLayout.height * 0.73,
              left: imageLayout.width * 0.27,
              width: imageLayout.width * 0.46,
              height: imageLayout.height * 0.1,
              opacity: 1,
              borderRadius: 20,
              backgroundColor: "transparent",
            }}
          />
        )}
      </View>
    </View>
  );
};

export default ListEmptyComponent;

const styles = StyleSheet.create({
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  userName: { fontWeight: 'bold', fontSize: 16, color: Colors.text },
  lastMessage: { marginTop: 4 },
  timestamp: { color: '#888', fontSize: 12 },

  onlineDot: {
    width: 12,
    height: 12,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    position: "absolute",
    bottom: 1,
    right: 1,
    borderWidth: 2,
  },
});
