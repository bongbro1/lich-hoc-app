import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import uuid from 'react-native-uuid';

import { useUser } from 'contexts/UserContext';
import { useImageFullModal } from 'contexts/ImageFullModalContext';
import * as RootNavigation from '../navigation/RootNavigation';
import { ChatStackParamList } from '../navigation/types';
import { Colors } from '../utils/theme';
import { formatCallDuration, formatChatTime } from '../utils/date';
import { createCall } from '../services/callService';
import { useUserVM } from 'viewmodels/useUserVM';
import { formatLastSeen } from 'utils/users';

import { useCallAction } from '../viewmodels/useCallAction';
import { Message } from 'types/chat.types';
import { useChatDetailVM } from 'viewmodels/useChatDetailVM';

// Memoized Message Item for performance - Moved outside to prevent re-creation
const MessageItem = React.memo(({
    item,
    isSender,
    partnerUser,
    theme,
    darkMode,
    renderImageMessage,
    renderCallMessage
}: {
    item: Message & { showTime?: boolean };
    isSender: boolean;
    partnerUser: any;
    theme: any;
    darkMode: boolean;
    renderImageMessage: any;
    renderCallMessage: any;
}) => {
    return (
        <>
            <View
                style={[
                    styles.messageContainer,
                    { transform: [{ scaleY: 1 }] }, // Ensure internal items are upright
                    isSender ? styles.messageContainerSent : styles.messageContainerReceived,
                ]}
            >
                {!isSender && (
                    <Image source={{ uri: partnerUser.avatar ?? '' }} style={styles.avatarSmall} />
                )}

                {item.messageType === 'text' && (
                    <View
                        style={[
                            styles.messageBubble,
                            isSender ? [styles.messageSent, { backgroundColor: theme.bubbleSent }] : [styles.messageReceived, { backgroundColor: theme.bubbleReceived }],
                            item.pending && styles.pendingMessage,
                        ]}
                    >
                        <Text
                            style={
                                isSender ? [styles.messageTextSent, { color: theme.textSent }] : { color: theme.textReceived }
                            }
                        >
                            {item.text}
                        </Text>
                    </View>
                )}

                {item.messageType === 'image' && renderImageMessage(item, isSender)}

                {item.messageType === 'call' && renderCallMessage(item, isSender)}
            </View>

            {item.showTime && (
                <View style={styles.timeRow}>
                    <Text style={[styles.messageTime, {
                        color: theme.textSecondary,
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
                    }]}>
                        {formatChatTime(item.timestamp)}
                    </Text>
                </View>
            )}
        </>
    );
});

type ChatDetailScreenProps = NativeStackScreenProps<ChatStackParamList, 'ChatDetailScreen'>;

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🥹', '👏'];

export const ChatDetailScreen = ({ route, navigation }: ChatDetailScreenProps) => {
    const insets = useSafeAreaInsets();
    const { user: partnerUser, selectedImages: pickedImages } = route.params;
    const flatListRef = useRef<FlatList<Message>>(null);
    const textInputRef = useRef<TextInput>(null);
    const isInputFocused = useRef(false);
    const { user: currentUser, darkMode } = useUser();
    const { openModal } = useImageFullModal();
    const stablePickedImages = useMemo(() => pickedImages ?? [], [pickedImages]);
    const [localConversationId, setLocalConversationId] = useState<string | undefined>(
        route.params.conversationId
    );
    const [showEmojiBar, setShowEmojiBar] = useState(false);

    const theme = {
        bg: darkMode ? '#0F172A' : '#FFFFFF',
        header: darkMode ? '#1E293B' : Colors.primary,
        headerText: darkMode ? '#F8FAFC' : '#FFFFFF',
        composer: darkMode ? '#1E293B' : '#FFFFFF',
        input: darkMode ? '#334155' : '#f1f1f1',
        inputText: darkMode ? '#F8FAFC' : '#000',
        bubbleReceived: darkMode ? '#334155' : '#eaeaeaff',
        bubbleSent: Colors.primary,
        textReceived: darkMode ? '#F8FAFC' : '#000',
        textSent: '#FFFFFF',
        textSecondary: darkMode ? '#94A3B8' : '#666',
        border: darkMode ? '#334155' : '#ddd',
        actionBtn: darkMode ? '#334155' : '#f4f7fb',
    };

    const currentUserInfo = useMemo(() => currentUser
        ? {
            studentId: currentUser.studentId,
            name: currentUser.name ?? '',
            avatar: currentUser.avatar ?? null,
            className: currentUser.className,
            online: true,
        }
        : undefined, [currentUser]);

    const handleConversationCreated = useCallback((newId: string) => {
        setLocalConversationId(newId);
        navigation.setParams({
            conversationId: newId,
        });
    }, [navigation]);

    const {
        messages,
        text,
        setText,
        selectedImages,
        setSelectedImages,
        sendMessage,
        markConversationSeen,
        loadMoreMessages,
        loading,
        hasMore,
    } = useChatDetailVM({
        conversationId: localConversationId,
        currentUserId: currentUser?.studentId,
        currentUserInfo,
        partnerUser,
        initialSelectedImages: stablePickedImages,
        onConversationCreated: handleConversationCreated,
    });

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                Keyboard.dismiss();
                isInputFocused.current = false;
            }
        });

        return () => subscription.remove();
    }, []);

    const lastMessageIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (messages.length > 0) {
            const newestMessage = messages[messages.length - 1];
            // Chỉ cuộn xuống nếu ID của tin nhắn mới nhất thay đổi (có tin mới)
            // Nếu ID cũ vẫn vậy mà length tăng lên -> đang load tin cũ -> không cuộn
            if (newestMessage.id !== lastMessageIdRef.current) {
                lastMessageIdRef.current = newestMessage.id;
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }
        }
    }, [messages]);

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => {
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);
        });

        return () => showSub.remove();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            markConversationSeen();
        }, [markConversationSeen])
    );

    const { presence, listenUserPresence } = useUserVM();

    useEffect(() => {
        if (!partnerUser?.studentId) return;

        const unsubscribe = listenUserPresence(partnerUser.studentId);

        return () => {
            unsubscribe?.();
        };
    }, [partnerUser?.studentId, listenUserPresence]);

    const scrollToEnd = () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    };

    const appendSelectedImages = (uris: string[]) => {
        if (uris.length === 0) return;

        setSelectedImages((prev) => {
            const seen = new Set(prev);
            const next = [...prev];

            uris.forEach((uri) => {
                if (!seen.has(uri)) {
                    seen.add(uri);
                    next.push(uri);
                }
            });

            return next;
        });

        setTimeout(scrollToEnd, 80);
    };

    const handlePickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Quyền truy cập ảnh',
                'Ứng dụng cần quyền truy cập thư viện ảnh để gửi tệp.'
            );
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 6,
        });

        if (result.canceled) {
            return;
        }

        appendSelectedImages(result.assets.map((asset) => asset.uri));
    };

    const handleRemoveSelectedImage = (uri: string) => {
        setSelectedImages((prev) => prev.filter((item) => item !== uri));
    };

    const handleSendCurrentMessage = async () => {
        if (!text.trim() && selectedImages.length === 0) {
            return;
        }

        await sendMessage();
        setShowEmojiBar(false);
        setTimeout(scrollToEnd, 80);
    };

    const handleQuickEmojiPress = async (emoji: string) => {
        await sendMessage({
            text: emoji,
            messageType: 'text',
        });

        setShowEmojiBar(false);
        setTimeout(scrollToEnd, 80);
    };

    const handlePressGoProfile = () => {
        RootNavigation.navigate('Dashboard', {
            screen: 'ProfileFeedScreen',
            params: {
                studentId: partnerUser.studentId,
            },
        });
    };

    const { startCall } = useCallAction();

    const handleAudioCall = async () => {
        if (!currentUser || !partnerUser) return;
        await startCall({
            currentUser,
            partnerUser,
            callType: 'audio',
            conversationId: localConversationId,
            returnScreen: 'ChatDetailScreen',
            returnParams: {
                user: partnerUser,
                currentUser,
                selectedImages,
                conversationId: localConversationId,
            },
        });
    };

    const handleVideoCall = async () => {
        if (!currentUser || !partnerUser) return;

        // Request permissions
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: audioStatus } = await Audio.requestPermissionsAsync();

        if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
            Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập camera và microphone để thực hiện cuộc gọi video.');
            return;
        }

        await startCall({
            currentUser,
            partnerUser,
            callType: 'video',
            conversationId: localConversationId,
            returnScreen: 'ChatDetailScreen',
            returnParams: {
                user: partnerUser,
                currentUser,
                selectedImages,
                conversationId: localConversationId,
            },
        });
    };
    const renderCallMessage = (item: Message, isSender: boolean) => {
        const isVideo = item.callType === 'video';
        const isMissed = !item.duration;
        const isIncoming = !isSender;

        const title = isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại';

        const subtitle = item.duration
            ? formatCallDuration(item.duration)
            : isIncoming
                ? 'Cuộc gọi nhỡ'
                : 'Không trả lời';

        return (
            <View
                style={[
                    styles.callContainer,
                    isSender ? [styles.callSent, { backgroundColor: darkMode ? Colors.primary + '20' : Colors.primary + '10' }] : [styles.callReceived, { backgroundColor: theme.composer, borderColor: theme.border }],
                ]}
            >
                <View style={[styles.callIconWrap, { backgroundColor: darkMode ? Colors.primary + '30' : Colors.primary + '15' }]}>
                    <Ionicons
                        name={isVideo ? 'videocam' : 'call'}
                        size={18}
                        color={Colors.primary}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <Text
                        style={[
                            styles.callTitle,
                            { color: theme.inputText },
                            isMissed && isIncoming && styles.callMissed,
                        ]}
                    >
                        {title}
                    </Text>

                    <Text style={[styles.callSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
                </View>
            </View>
        );
    };

    const renderImageMessage = (item: Message, isSender: boolean) => {
        const images = item.images ?? [];
        const hasCaption = Boolean(item.text?.trim());
        const isMultiple = images.length > 1;

        return (
            <View
                style={[
                    styles.imageBubble,
                    isSender ? styles.imageBubbleSent : [styles.imageBubbleReceived, { backgroundColor: theme.bubbleReceived }],
                    item.pending && styles.pendingMessage,
                ]}
            >
                <View style={styles.imageGrid}>
                    {images.map((uri, imageIndex) => (
                        <TouchableOpacity
                            key={`${item.id}-${imageIndex}`}
                            activeOpacity={0.95}
                            onPress={() => openModal(images, imageIndex)}
                        >
                            <Image
                                source={{ uri }}
                                style={[
                                    styles.messageImage,
                                    isMultiple
                                        ? styles.messageImageMulti
                                        : styles.messageImageSingle,
                                ]}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {hasCaption && (
                    <Text
                        style={[
                            styles.imageCaption,
                            isSender ? styles.messageTextSent : { color: theme.textReceived },
                        ]}
                    >
                        {item.text}
                    </Text>
                )}
            </View>
        );
    };

    const processedMessages = useMemo(() => {
        return messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            let showTime = true;
            if (prevMsg) {
                const prevTime = new Date(prevMsg.timestamp).getTime();
                const currTime = new Date(msg.timestamp).getTime();
                showTime = (currTime - prevTime) > (1000 * 60 * 60); // 1 hour gap
            }
            return { ...msg, showTime };
        });
    }, [messages]);

    const displayMessages = useMemo(() => [...processedMessages].reverse(), [processedMessages]);

    const isComposerEmpty = !text.trim() && selectedImages.length === 0;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
            <View style={[styles.screen, { backgroundColor: theme.bg }]}>
                <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.header }]}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Icon name="arrow-back" size={24} color={theme.headerText} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handlePressGoProfile}
                        style={styles.headerUser}
                    >
                        <Image
                            source={{ uri: partnerUser.avatar ?? '' }}
                            style={styles.avatar}
                        />

                        <View>
                            <Text style={[styles.userName, { color: theme.headerText }]} numberOfLines={1}>
                                {partnerUser.name}
                            </Text><Text style={[styles.onlineText, { color: darkMode ? '#94A3B8' : '#E0F2F1' }]} numberOfLines={1}>
                                {presence.online
                                    ? 'Đang hoạt động'
                                    : formatLastSeen(presence.lastSeen)}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.iconButton}
                            onPress={handleAudioCall}
                        >
                            <Ionicons name="call" size={18} color={theme.headerText} />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.8} style={styles.iconButton} onPress={handleVideoCall}>
                            <Ionicons name="videocam" size={22} color={theme.headerText} />
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={displayMessages}
                    inverted
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageListContent}
                    renderItem={({ item }) => (
                        <MessageItem
                            item={item}
                            isSender={item.senderId === currentUser?.studentId}
                            partnerUser={partnerUser}
                            theme={theme}
                            darkMode={darkMode}
                            renderImageMessage={renderImageMessage}
                            renderCallMessage={renderCallMessage}
                        />
                    )}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    style={styles.messageList}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    removeClippedSubviews={true}
                    onEndReached={loadMoreMessages}
                    onEndReachedThreshold={0.2}
                    ListFooterComponent={() => (
                        loading && hasMore ? (
                            <View style={styles.footerLoading}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                            </View>
                        ) : null
                    )}
                />

                <View style={[styles.composerContainer, { backgroundColor: theme.composer, borderTopColor: theme.border }]}>
                    {selectedImages.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.previewScrollContent}
                            style={styles.previewScroll}
                        >
                            {selectedImages.map((uri, index) => (
                                <View key={`${uri}-${index}`} style={[styles.previewItem, { backgroundColor: theme.input }]}>
                                    <Image source={{ uri }} style={styles.previewImage} />
                                    <TouchableOpacity
                                        style={styles.previewRemoveButton}
                                        onPress={() => handleRemoveSelectedImage(uri)}
                                        activeOpacity={0.8}
                                    >
                                        <Icon name="close" size={14} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {showEmojiBar && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.emojiBarContent}
                            style={styles.emojiBar}
                        >
                            {QUICK_EMOJIS.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={[styles.emojiChip, { backgroundColor: theme.input, borderColor: theme.border }]}
                                    onPress={() => handleQuickEmojiPress(emoji)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.emojiChipText}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    <View style={styles.inputContainer}>
                        <TouchableOpacity
                            onPress={handlePickImages}
                            style={[styles.actionButton, { backgroundColor: theme.actionBtn }]}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="image-outline" size={21} color={Colors.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowEmojiBar((prev) => !prev)}
                            style={[styles.actionButton, { backgroundColor: theme.actionBtn }]}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="happy-outline" size={21} color={Colors.primary} />
                        </TouchableOpacity>

                        <TextInput
                            ref={textInputRef}
                            placeholder="Nhập tin nhắn..."
                            placeholderTextColor={darkMode ? '#64748B' : '#888'}
                            style={[styles.textInput, { backgroundColor: theme.input, color: theme.inputText }]}
                            value={text}
                            onChangeText={setText}
                            multiline
                            onBlur={() => (isInputFocused.current = false)}
                            onFocus={() => {
                                isInputFocused.current = true;
                                setTimeout(() => {
                                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                                }, 150);
                            }}
                        />

                        <TouchableOpacity
                            onPress={handleSendCurrentMessage}
                            style={[
                                styles.sendButton,
                            ]}
                            activeOpacity={0.8}
                            disabled={isComposerEmpty}
                        >
                            <Ionicons name="arrow-up" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
        flexGrow: 1,
    },
    composerContainer: {
        borderTopWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        paddingTop: 8,
        paddingBottom: 8,
    },
    previewScroll: {
        maxHeight: 84,
    },
    previewScrollContent: {
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    previewItem: {
        width: 68,
        height: 68,
        borderRadius: 14,
        marginHorizontal: 4,
        overflow: 'hidden',
        backgroundColor: '#eef2f7',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    previewRemoveButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiBar: {
        maxHeight: 52,
    },
    emojiBarContent: {
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    emojiChip: {
        minWidth: 44,
        height: 36,
        marginHorizontal: 4,
        borderRadius: 18,
        backgroundColor: '#f4f7fb',
        borderWidth: 1,
        borderColor: '#d8e4ff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    emojiChipText: {
        fontSize: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    actionButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f7fb',
        marginRight: 6,
    },
    textInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 110,
        backgroundColor: '#f1f1f1',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 10,
        textAlignVertical: 'center',
    },
    sendButton: {
        backgroundColor: Colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.45,
    },
    messageTime: {
        fontSize: 12,
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
    },
    callContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        maxWidth: '70%',
        marginVertical: 4,
        borderWidth: 1,
    },
    callSent: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.primary + '10',
        borderColor: Colors.primary,
    },
    callReceived: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderColor: '#E4E6EB',
    },
    callIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    callTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    callSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    callMissed: {
        color: '#FF3B30',
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    messageContainerSent: {
        justifyContent: 'flex-end',
    },
    messageContainerReceived: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '72%',
        padding: 10,
        borderRadius: 12,
    },
    messageSent: {
        backgroundColor: Colors.primary,
        alignSelf: 'flex-end',
        borderTopRightRadius: 4,
    },
    messageReceived: {
        backgroundColor: '#eaeaeaff',
        alignSelf: 'flex-start',
        borderTopLeftRadius: 4,
    },
    imageBubble: {
        maxWidth: '76%',
        padding: 6,
        borderRadius: 16,
    },
    imageBubbleSent: {
        backgroundColor: Colors.primary,
        alignSelf: 'flex-end',
        borderTopRightRadius: 4,
    },
    imageBubbleReceived: {
        backgroundColor: '#eaeaeaff',
        alignSelf: 'flex-start',
        borderTopLeftRadius: 4,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    messageImage: {
        borderRadius: 12,
        backgroundColor: '#dfe6ee',
    },
    messageImageSingle: {
        width: 220,
        height: 220,
    },
    messageImageMulti: {
        width: 104,
        height: 104,
        marginRight: 4,
        marginBottom: 4,
    },
    imageCaption: {
        marginTop: 4,
        paddingHorizontal: 4,
        paddingBottom: 2,
    },
    pendingMessage: {
        opacity: 0.7,
    },
    messageTextSent: {
        color: '#fff',
    },
    messageTextReceived: {
        color: '#000',
    },
    header: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        justifyContent: 'flex-start',
        paddingBottom: 14,
        borderBottomColor: '#c0d4ff',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    backButton: {
        padding: 8,
    },
    headerUser: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flex: 1,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginLeft: 8,
    },
    userName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
        flex: 1,
    },
    onlineText: {
        color: '#e0e0e0ee',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    iconButton: {
        width: 34,
        height: 34,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        marginTop: 4,
    },
    timeRow: {
        width: '100%',
        alignItems: 'center',
        marginVertical: 8,
    },
    footerLoading: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
