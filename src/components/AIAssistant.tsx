import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    PanResponder,
    ScrollView,
    Keyboard,
    Image,
    ActivityIndicator,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useAlert } from '../contexts/AlertContext';
import {
    X,
    PaperPlaneRight,
    Robot,
    User,
    Sparkle,
    Minus,
    Image as ImageIcon,
    FilePlus,
    Paperclip,
    FileText,
    Trash,
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../utils/theme';
import { useAIAssistantVM } from '../viewmodels/useAIAssistantVM';
import { AIMessage } from '../types/ai.types';
import { TypingIndicator } from './TypingIndicator';

const { width, height } = Dimensions.get('window');

// Reusing AIMessage from types/ai.types.ts


const QUICK_SUGGESTIONS = [
    "Tóm tắt bài học hôm nay",
    "Giải thích nội dung này dễ hiểu hơn",
    "Tạo câu hỏi ôn tập",
    "Mình nên ôn gì cho môn này?",
];

export const AIAssistant = React.memo(() => {
    const {
        messages,
        inputText,
        setInputText,
        isLoading,
        isFetchingMore,
        loadMore,
        hasMore,
        handleSendMessage,
        clearChat,
        selectedImage,
        setSelectedImage,
        selectedFile,
        setSelectedFile,
    } = useAIAssistantVM();

    const { showAlert } = useAlert();

    const [isVisible, setIsVisible] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isFabMounted, setIsFabMounted] = useState(true);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;
    const buttonScale = useRef(new Animated.Value(0)).current;

    // Draggable Logic
    const FAB_SIZE = 60;
    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gestureState) => {
                pan.flattenOffset();

                const initialRight = 20;
                const initialBottom = insets.bottom + 80;

                const minX = -(width - FAB_SIZE - initialRight - 10);
                const maxX = initialRight - 10;
                const minY = -(height - FAB_SIZE - initialBottom - insets.top - 20);
                const maxY = initialBottom - 40;

                let finalX = (pan.x as any)._value;
                let finalY = (pan.y as any)._value;

                if (finalX < minX) finalX = minX;
                if (finalX > maxX) finalX = maxX;
                if (finalY < minY) finalY = minY;
                if (finalY > maxY) finalY = maxY;

                Animated.spring(pan, {
                    toValue: { x: finalX, y: finalY },
                    useNativeDriver: true,
                    tension: 60,
                    friction: 10,
                }).start();
            },
        })
    ).current;

    useEffect(() => {
        const shouldShow = isVisible && !isOpen;
        if (shouldShow) {
            setIsFabMounted(true);
            Animated.spring(buttonScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();
        } else {
            Animated.timing(buttonScale, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start((result) => {
                if (result.finished) {
                    setIsFabMounted(false);
                }
            });
        }
    }, [isVisible, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 40,
                    friction: 8,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start((finished) => {
                if (finished) {
                    setIsMounted(false);
                }
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                setIsKeyboardVisible(true);
                if (Platform.OS === 'android') {
                    setKeyboardHeight(e.endCoordinates.height);
                }
            }
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setIsKeyboardVisible(false);
                if (Platform.OS === 'android') {
                    setKeyboardHeight(0);
                }
            }
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const lastMessageIdRef = useRef<string | null>(null);
    const isLastUpdateLoadMore = useRef(false);

    // Reset ref khi đóng chat để lần sau mở lại sẽ tự động cuộn xuống cuối
    useEffect(() => {
        if (!isOpen) {
            lastMessageIdRef.current = null;
        }
    }, [isOpen]);


    // Inverted list sẽ tự động giữ vị trí ở dưới cùng (offset 0) khi mở chat
    useEffect(() => {
        if (isOpen && messages.length > 0) {
            const currentLastId = messages[0]?.id; // Tin mới nhất ở index 0

            if (currentLastId !== lastMessageIdRef.current) {
                // Nếu là tin nhắn mới gửi, ta có thể cuộn nhẹ về 0 để chắc chắn
                if (!isFetchingMore && lastMessageIdRef.current !== null) {
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                }
                lastMessageIdRef.current = currentLastId;
            }
        }
    }, [isOpen, messages, isFetchingMore]);

    // Tự động reset flag loadmore
    useEffect(() => {
        if (!isFetchingMore && isLastUpdateLoadMore.current) {
            const timer = setTimeout(() => {
                isLastUpdateLoadMore.current = false;
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isFetchingMore]);

    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            // Cuộn về 0 (dưới cùng) sau khi AI trả lời
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
    }, [isLoading]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            setSelectedFile(null);
        }
    };

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                setSelectedFile({
                    name: result.assets[0].name,
                    uri: result.assets[0].uri,
                    size: result.assets[0].size,
                });
                setSelectedImage(null);
            }
        } catch (err) {
            console.log('Error picking document:', err);
        }
    };



    const renderMessage = ({ item }: { item: AIMessage }) => (
        <View style={[
            styles.messageWrapper,
            item.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper
        ]}>
            {!item.isUser && (
                <View style={styles.aiAvatar}>
                    <Robot size={16} color="#FFF" weight="fill" />
                </View>
            )}
            <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
                {item.image && (
                    <Image source={{ uri: item.image }} style={styles.messageImage} resizeMode="cover" />
                )}
                {item.file && (
                    <View style={styles.fileContainer}>
                        <FileText size={24} color={item.isUser ? '#FFF' : Colors.primary} weight="fill" />
                        <View style={styles.fileInfo}>
                            <Text style={[styles.fileName, { color: item.isUser ? '#FFF' : '#1E293B' }]} numberOfLines={1}>
                                {item.file.name}
                            </Text>
                            {item.file.size && (
                                <Text style={[styles.fileSize, { color: item.isUser ? 'rgba(255,255,255,0.7)' : '#64748B' }]}>
                                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                </Text>
                            )}
                        </View>
                    </View>
                )}
                {item.isThinking ? (
                    <TypingIndicator />
                ) : (
                    item.text ? (
                        item.isUser ? (
                            <Text style={[styles.messageText, styles.userText]}>
                                {item.text}
                            </Text>
                        ) : (
                            <Markdown style={markdownStyles}>
                                {item.text}
                            </Markdown>
                        )
                    ) : null
                )}
            </View>
        </View>
    );

    const renderChatContent = () => {
        return (
            <>
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <View style={styles.headerIcon}>
                            <Robot size={24} color={Colors.primary} weight="duotone" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Trợ lý học tập</Text>
                            <View style={styles.statusRow}>
                                <View style={styles.onlineDot} />
                                <Text style={styles.statusText}>Đang sẵn sàng hỗ trợ</Text>
                            </View>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity activeOpacity={0.8}
                            onPress={() => {
                                showAlert({
                                    type: "warning",
                                    title: "Xóa cuộc trò chuyện",
                                    message: "Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện này không?",
                                    confirmText: "Xóa",
                                    cancelText: "Hủy",
                                    onConfirm: clearChat
                                });
                            }}
                            style={[styles.headerClose, { marginRight: 4 }]}
                        >
                            <Trash size={22} color="#EF4444" weight="bold" />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.8} onPress={() => setIsOpen(false)} style={styles.headerClose}>
                            <X size={22} color="#64748B" weight="bold" />
                        </TouchableOpacity>
                    </View>
                </View>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    inverted
                    onEndReached={() => {
                        if (hasMore && !isFetchingMore && messages.length > 0) {
                            isLastUpdateLoadMore.current = true;
                            loadMore();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={() => isFetchingMore ? (
                        <View style={styles.loadMoreContainer}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                        </View>
                    ) : null}
                />

                <View style={styles.suggestionsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                        {QUICK_SUGGESTIONS.map((s, i) => (
                            <TouchableOpacity
                                key={i}
                                activeOpacity={0.8}
                                style={styles.suggestionItem}
                                onPress={() => {
                                    isLastUpdateLoadMore.current = false;
                                    handleSendMessage(s);
                                }}
                            >
                                <Text style={styles.suggestionText}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Attachment Preview */}
                {(selectedImage || selectedFile) && (
                    <Animated.View style={styles.previewContainer}>
                        <View style={styles.previewContent}>
                            {selectedImage ? (
                                <View style={styles.imagePreviewWrapper}>
                                    <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                                    <TouchableOpacity style={styles.removePreview} onPress={() => setSelectedImage(null)}>
                                        <X size={10} color="#FFF" weight="bold" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.filePreviewWrapper}>
                                    <View style={styles.fileIconBadge}>
                                        <FileText size={20} color="#FFF" weight="fill" />
                                    </View>
                                    <Text style={styles.filePreviewName} numberOfLines={1}>
                                        {selectedFile?.name}
                                    </Text>
                                    <TouchableOpacity style={styles.removePreview} onPress={() => setSelectedFile(null)}>
                                        <X size={10} color="#FFF" weight="bold" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                )}

                <View style={styles.inputContainer}>
                    <View style={styles.leftActions}>
                        <TouchableOpacity activeOpacity={0.8} style={styles.circularAttachButton} onPress={pickImage}>
                            <ImageIcon size={20} color={Colors.primary} weight="bold" />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.8} style={styles.circularAttachButton} onPress={pickFile}>
                            <Paperclip size={20} color={Colors.primary} weight="bold" />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập câu hỏi của bạn..."
                        placeholderTextColor="#94A3B8"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity activeOpacity={0.8}
                        style={[styles.sendButton, (!inputText.trim() && !selectedImage && !selectedFile) && styles.sendButtonDisabled]}
                        onPress={() => {
                            isLastUpdateLoadMore.current = false;
                            handleSendMessage(inputText);
                        }}
                        disabled={!inputText.trim() && !selectedImage && !selectedFile}
                    >
                        <PaperPlaneRight size={20} color="#FFF" weight="fill" />
                    </TouchableOpacity>
                </View>
            </>
        );
    };

    if (!isVisible && !isOpen && !isMounted && !isFabMounted) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Overlay */}
            {isMounted && (
                <Animated.View
                    style={[styles.overlay, { opacity: fadeAnim }]}
                    pointerEvents={isOpen ? "auto" : "none"}
                >
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setIsOpen(false)}
                    />
                </Animated.View>
            )}

            {/* Floating Action Button */}
            {isFabMounted && (
                <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                        styles.fabContainer,
                        {
                            opacity: buttonScale,
                            transform: [
                                { translateX: pan.x },
                                { translateY: pan.y }
                            ],
                            bottom: insets.bottom + 80,
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.fab}
                        activeOpacity={0.95}
                        onPress={() => setIsOpen(true)}
                    >
                        <Sparkle size={28} color="#FFF" weight="fill" />
                        <View style={styles.badge} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.closeFab}
                        activeOpacity={0.9}
                        onPress={() => setIsVisible(false)}
                    >
                        <X size={12} color="#FFF" weight="bold" />
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Chat Window */}
            {isMounted && (
                Platform.OS === 'ios' ? (
                    <KeyboardAvoidingView
                        behavior="padding"
                        style={StyleSheet.absoluteFill}
                        pointerEvents="box-none"
                        keyboardVerticalOffset={insets.top}
                    >
                        <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
                            <Animated.View
                                pointerEvents="auto"
                                style={[
                                    styles.chatWindow,
                                    {
                                        transform: [{ translateY: slideAnim }],
                                        height: isKeyboardVisible ? '55%' : '75%',
                                        paddingBottom: isKeyboardVisible ? 10 : (insets.bottom || 20),
                                    }
                                ]}
                            >
                                {renderChatContent()}
                            </Animated.View>
                        </View>
                    </KeyboardAvoidingView>
                ) : (
                    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                        <Animated.View
                            pointerEvents="auto"
                            style={[
                                styles.chatWindow,
                                {
                                    transform: [{ translateY: slideAnim }],
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    bottom: isKeyboardVisible ? (Platform.OS === 'android' ? keyboardHeight - insets.bottom - 20 : keyboardHeight) : 0,
                                    height: isKeyboardVisible ? height * 0.5 : height * 0.75,
                                    paddingBottom: 10,
                                }
                            ]}
                        >
                            {renderChatContent()}
                        </Animated.View>
                    </View>
                )
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    fabContainer: {
        position: 'absolute',
        right: 20,
        zIndex: 9999,
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    closeFab: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#64748B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    badge: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    chatWindow: {
        width: '100%',
        maxHeight: '100%',
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        zIndex: 10000,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#64748B',
    },
    headerClose: {
        padding: 8,
    },
    messagesList: {
        padding: 20,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-end',
    },
    userMessageWrapper: {
        justifyContent: 'flex-end',
    },
    aiMessageWrapper: {
        justifyContent: 'flex-start',
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 18,
    },
    userBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: '#F1F5F9',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    userText: {
        color: '#FFF',
    },
    aiText: {
        color: '#1E293B',
    },
    suggestionsContainer: {
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    suggestionsScroll: {
        paddingHorizontal: 20,
    },
    suggestionItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.primary + '10',
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.primary + '20',
    },
    suggestionText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    leftActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    circularAttachButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        color: '#1E293B',
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    messageImage: {
        width: 200,
        height: 150,
        borderRadius: 12,
        marginBottom: 8,
    },
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 8,
        minWidth: 150,
    },
    fileInfo: {
        marginLeft: 10,
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
    },
    fileSize: {
        fontSize: 11,
        marginTop: 2,
    },
    previewContainer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    previewContent: {
        flexDirection: 'row',
    },
    imagePreviewWrapper: {
        width: 70,
        height: 70,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        padding: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    filePreviewWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 8,
        paddingRight: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        maxWidth: '80%',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    fileIconBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    filePreviewName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        flexShrink: 1,
    },
    removePreview: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#EF4444',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        zIndex: 1,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sendButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    loadMoreContainer: {
        paddingVertical: 10,
        alignItems: 'center',
    },
});

const markdownStyles = {
    body: {
        color: '#1E293B',
        fontSize: 14,
        lineHeight: 22,
    },
    heading1: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600' as const,
        marginVertical: 6,
    },
    heading2: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600' as const,
        marginVertical: 6,
    },
    heading3: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600' as const,
        marginVertical: 6,
    },
    strong: {
        fontWeight: 'bold' as const,
        color: '#0F172A',
    },
    em: {
        fontStyle: 'italic' as const,
    },
    link: {
        color: Colors.primary,
        textDecorationLine: 'underline' as const,
    },
    list_item: {
        marginVertical: 4,
    },
    bullet_list: {
        marginVertical: 5,
    },
    ordered_list: {
        marginVertical: 5,
    },
    code_inline: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 4,
        borderRadius: 4,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: '#E11D48',
    },
    code_block: {
        backgroundColor: '#0F172A',
        padding: 12,
        borderRadius: 8,
        marginVertical: 10,
        color: '#F8FAFC',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    fence: {
        backgroundColor: '#0F172A',
        padding: 12,
        borderRadius: 8,
        marginVertical: 10,
        color: '#F8FAFC',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    table: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        marginVertical: 10,
        backgroundColor: '#FFF',
    },
    thead: {
        backgroundColor: '#F8FAFC',
    },
    th: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
        fontWeight: 'bold' as const,
        color: '#475569',
    },
    tr: {
        flexDirection: 'row' as const,
    },
    td: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
        color: '#64748B',
    },
    blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
        paddingLeft: 12,
        marginVertical: 10,
        backgroundColor: '#F8FAFC',
        paddingVertical: 5,
    },
};
