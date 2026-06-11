import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    TextInput,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Colors } from 'utils/theme';

export function calculateNumColumns({
    windowWidth = 0,
    containerPadding = 16,
    paddingIsBothSides = true,
    spacing = 8,
    minImageWidth = 100,
    minColumns = 1,
    maxColumns = 5,
}) {
    const totalPadding = paddingIsBothSides ? containerPadding * 2 : containerPadding;
    const availableWidth = Math.max(0, windowWidth - totalPadding);

    for (let cols = maxColumns; cols >= minColumns; cols--) {
        const totalSpacing = spacing * (cols - 1);
        const itemWidth = (availableWidth - totalSpacing) / cols;

        if (itemWidth >= minImageWidth) {
            return cols;
        }
    }

    return minColumns;
}

interface ImageFullModalProps {
    visible: boolean;
    onClose: () => void;
    images: string[];
    initialIndex?: number;
    editableType?: 'avatar' | 'cover';
    onRequestChange?: () => void;
    isStory?: boolean;
    userName?: string | null;
    userAvatar?: string | null;
    storyTimestamps?: (string | undefined)[];
    onDeleteStory?: (index: number) => void;
}

export const ImageFullModal: React.FC<ImageFullModalProps> = ({
    visible,
    onClose,
    images,
    initialIndex = 0,
    editableType,
    onRequestChange,
    isStory = false,
    userName,
    userAvatar,
    storyTimestamps,
    onDeleteStory,
}) => {
    const flatListRef = useRef<FlatList<string>>(null);
    const { width, height } = Dimensions.get('window');
    const [ratios, setRatios] = useState<Record<string, number>>({});
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Animation progress bar cho story
    const progressAnim = useRef(new Animated.Value(0)).current;
    const progressRef = useRef(0);
    const animRef = useRef<Animated.CompositeAnimation | null>(null);
    const touchStartTimeRef = useRef(0);

    // Lưu trữ tiến trình hiện tại để tiếp tục chạy khi thả tay
    useEffect(() => {
        const listener = progressAnim.addListener(({ value }) => {
            progressRef.current = value;
        });
        return () => progressAnim.removeListener(listener);
    }, []);

    useEffect(() => {
        if (!visible) {
            setShowActionSheet(false);
            progressAnim.setValue(0);
            progressRef.current = 0;
            setIsPaused(false);
            return;
        }

        setCurrentIndex(initialIndex);

        setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: initialIndex,
                animated: false,
            });
        }, 0);
    }, [visible, initialIndex]);

    // Điều khiển Animation Timeline (Chạy / Tạm dừng / Tiếp tục)
    useEffect(() => {
        if (!visible || !isStory) return;

        // Dừng triệt để bất kỳ animation nào đang chạy trước đó
        animRef.current?.stop();

        if (isPaused) {
            return;
        }

        // Bắt đầu hoặc tiếp tục chạy từ vị trí hiện tại (progressRef.current)
        const remainingPercentage = 1 - progressRef.current;
        const duration = 6000 * remainingPercentage; // 6s tổng cộng cho mỗi story

        const anim = Animated.timing(progressAnim, {
            toValue: 1,
            duration: Math.max(0, duration),
            useNativeDriver: false,
        });

        animRef.current = anim;
        anim.start(({ finished }) => {
            if (finished) {
                progressRef.current = 0;
                progressAnim.setValue(0);
                handleNextStory();
            }
        });

        return () => {
            anim.stop();
        };
    }, [visible, isStory, currentIndex, isPaused]);

    const handleNextStory = () => {
        progressRef.current = 0;
        progressAnim.setValue(0);
        if (currentIndex < images.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        } else {
            onClose(); // Hết danh sách thì đóng
        }
    };

    const handlePrevStory = () => {
        progressRef.current = 0;
        progressAnim.setValue(0);
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
        }
    };

    const getRatio = (uri: string) => {
        if (ratios[uri]) return;

        Image.getSize(
            uri,
            (w, h) => {
                setRatios((prev) => ({
                    ...prev,
                    [uri]: w / h,
                }));
            },
            () => { }
        );
    };

    const handleEditPress = () => {
        if (!onRequestChange && !onDeleteStory) {
            return;
        }
        setShowActionSheet(true);
    };

    const handleDeleteCurrentStory = () => {
        setShowActionSheet(false);
        onClose();
        onDeleteStory?.(currentIndex);
    };

    const handleRequestChange = () => {
        setShowActionSheet(false);
        onClose();
        onRequestChange?.();
    };

    const handleSendReaction = (emoji: string) => {
        alert(`Bạn đã thả cảm xúc ${emoji} cho tin này!`);
    };

    const handleSendReply = () => {
        if (!replyText.trim()) return;
        alert(`Đã gửi phản hồi: "${replyText}"`);
        setReplyText('');
    };

    const actionLabel =
        editableType === 'cover'
            ? 'Đổi ảnh bìa'
            : 'Đổi ảnh đại diện';

    const actionDescription =
        editableType === 'cover'
            ? 'Chọn ảnh mới để cập nhật ảnh bìa.'
            : 'Chọn ảnh mới để cập nhật ảnh đại diện.';

    if (isStory) {
        return (
            <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
                <KeyboardAvoidingView
                    behavior={undefined}
                    enabled={false}
                    style={styles.storyOverlay}
                >
                    {/* Immersive Touch overlay for play/pause and fast navigation */}
                    <View
                        style={styles.gestureOverlay}
                        onTouchStart={() => {
                            // Nhấn giữ: ghi lại thời gian bắt đầu chạm và tạm dừng timeline
                            touchStartTimeRef.current = Date.now();
                            setIsPaused(true);
                        }}
                        onTouchEnd={(e) => {
                            // Thả tay ra: giải phóng trạng thái tạm dừng timeline để chạy tiếp
                            setIsPaused(false);

                            const touchDuration = Date.now() - touchStartTimeRef.current;

                            // Nếu giữ lâu hơn 250ms => Nhận diện là LONG PRESS
                            // Chỉ tiếp tục chạy timeline, không thực hiện hành động chuyển tiếp (Next/Prev)
                            if (touchDuration > 250) {
                                return;
                            }

                            // Nếu chạm nhanh dưới 250ms => Nhận diện là SHORT TAP => Thực hiện điều hướng
                            const touchX = e.nativeEvent.pageX || e.nativeEvent.locationX;
                            if (touchX < width / 3) {
                                handlePrevStory();
                            } else {
                                handleNextStory();
                            }
                        }}
                        onTouchCancel={() => {
                            setIsPaused(false);
                        }}
                    />

                    {/* TOP HEADER AREA - Giữ nguyên không ẩn khi tạm dừng */}
                    <View style={[styles.storyHeader, { paddingTop: insets.top + 8 }]}>
                        {/* Progress Indicators */}
                        <View style={styles.progressRow}>
                            {images.map((_, index) => {
                                let widthPercent: any = '0%';
                                if (index < currentIndex) {
                                    widthPercent = '100%';
                                } else if (index === currentIndex) {
                                    widthPercent = progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    });
                                }
                                return (
                                    <View key={index} style={styles.progressBarBg}>
                                        <Animated.View style={[styles.progressBarFill, { width: widthPercent }]} />
                                    </View>
                                );
                            })}
                        </View>

                        {/* User Profile Info & Controls */}
                        <View style={styles.storyUserInfoRow}>
                            <View style={styles.storyUserLeft}>
                                <Image
                                    source={{ uri: userAvatar || 'https://via.placeholder.com/150' }}
                                    style={styles.storyAvatar}
                                />
                                <View style={styles.storyTextCol}>
                                    <Text style={styles.storyUserName}>{userName || 'Người dùng'}</Text>
                                    <Text style={styles.storyTime}>Vừa xong</Text>
                                </View>
                            </View>

                            <View style={styles.storyUserRight}>
                                <TouchableOpacity onPress={handleEditPress} style={[styles.storyCloseBtn, { marginRight: 12 }]}>
                                    <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={onClose} style={styles.storyCloseBtn}>
                                    <Ionicons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>


                    {/* MAIN IMMERSIVE CONTENT CAROUSEL */}
                    <View style={styles.storyCarousel}>
                        <FlatList
                            ref={flatListRef}
                            data={images}
                            horizontal
                            scrollEnabled={false} // Chỉ cho chuyển qua tap 1/3
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(uri, idx) => uri + idx}
                            renderItem={({ item }) => {
                                return (
                                    <View style={[styles.storyImagePage, { width }]}>
                                        <Image
                                            source={{ uri: item }}
                                            style={styles.storyFullImage}
                                            resizeMode="cover"
                                        />
                                    </View>
                                );
                            }}
                        />
                    </View>

                    {/* BOTTOM INTERACTION AREA - Giữ nguyên không ẩn khi tạm dừng */}
                    <View style={[styles.storyFooter, { paddingBottom: Math.max(insets.bottom, 16) + 8, bottom: keyboardHeight }]}>
                        {/* Reactions Row */}
                        <View style={styles.reactionsRow}>
                            {['👍', '❤️', '🥰', '😆', '😮', '😢', '😡'].map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={styles.reactionItem}
                                    onPress={() => handleSendReaction(emoji)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Input Row */}
                        <View style={styles.storyInputRow}>
                            <TextInput
                                style={styles.storyInput}
                                placeholder="Gửi phản hồi cho tin..."
                                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                                value={replyText}
                                onChangeText={setReplyText}
                                onSubmitEditing={handleSendReply}
                            />
                            {replyText.trim() ? (
                                <TouchableOpacity onPress={handleSendReply} style={styles.sendIconBtn}>
                                    <Ionicons name="send" size={22} color="#1877F2" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity activeOpacity={0.8} style={styles.sendIconBtn}>
                                    <Ionicons name="share-social-outline" size={22} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {showActionSheet && (
                        <View style={styles.actionSheetLayer} pointerEvents="box-none">
                            <TouchableWithoutFeedback onPress={() => setShowActionSheet(false)}>
                                <View style={styles.actionSheetBackdrop} />
                            </TouchableWithoutFeedback>

                            <View
                                style={[
                                    styles.actionSheet,
                                    { paddingBottom: Math.max(insets.bottom, 12) + 12 },
                                ]}
                            >
                                <View style={styles.actionSheetHandle} />
                                <Text style={styles.actionSheetTitle}>Tùy chọn tin</Text>
                                <Text style={styles.actionSheetDescription}>
                                    Bạn muốn thực hiện thao tác gì với tin này?
                                </Text>

                                {onDeleteStory && (
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        style={[styles.actionSheetPrimaryButton, { backgroundColor: '#EF4444' }]}
                                        onPress={handleDeleteCurrentStory}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#fff" />
                                        <Text style={styles.actionSheetPrimaryText}>Xóa tin này</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    style={styles.actionSheetGhostButton}
                                    onPress={() => setShowActionSheet(false)}
                                >
                                    <Text style={styles.actionSheetGhostText}>Đóng</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </KeyboardAvoidingView>
            </Modal >
        );
    }

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={StyleSheet.absoluteFillObject} />
                </TouchableWithoutFeedback>

                <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.topIconButton}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.counterText}>
                        {images.length > 1 ? `${currentIndex + 1}/${images.length}` : ''}
                    </Text>

                    {editableType && onRequestChange ? (
                        <TouchableOpacity
                            onPress={handleEditPress}
                            style={styles.topIconButton}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.topIconPlaceholder} />
                    )}
                </View>

                <View style={styles.carouselContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        initialNumToRender={3}
                        windowSize={5}
                        maxToRenderPerBatch={3}
                        keyExtractor={(uri, idx) => uri + idx}
                        onMomentumScrollEnd={(event) => {
                            const nextIndex = Math.round(
                                event.nativeEvent.contentOffset.x / width
                            );
                            setCurrentIndex(nextIndex);
                        }}
                        onScrollToIndexFailed={() => {
                            setTimeout(() => {
                                flatListRef.current?.scrollToOffset({
                                    offset: width * initialIndex,
                                    animated: false,
                                });
                            }, 80);
                        }}
                        renderItem={({ item }) => {
                            getRatio(item);

                            return (
                                <View style={[styles.imagePage, { width }]} pointerEvents="box-none">
                                    <ScrollView
                                        maximumZoomScale={4}
                                        minimumZoomScale={1}
                                        showsHorizontalScrollIndicator={false}
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={{
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                        style={{ flexGrow: 0 }}
                                    >
                                        <ExpoImage
                                            source={{ uri: item }}
                                            style={{
                                                width: width,
                                                height: height * 0.6,
                                            }}
                                            contentFit="cover"
                                            priority="high"
                                            transition={300}
                                            cachePolicy="memory-disk"
                                        />
                                    </ScrollView>
                                </View>
                            );
                        }}
                    />
                </View>

                {showActionSheet && (
                    <View style={styles.actionSheetLayer} pointerEvents="box-none">
                        <TouchableWithoutFeedback onPress={() => setShowActionSheet(false)}>
                            <View style={styles.actionSheetBackdrop} />
                        </TouchableWithoutFeedback>

                        <View
                            style={[
                                styles.actionSheet,
                                { paddingBottom: Math.max(insets.bottom, 12) + 12 },
                            ]}
                        >
                            <View style={styles.actionSheetHandle} />
                            <Text style={styles.actionSheetTitle}>Tùy chọn ảnh</Text>
                            <Text style={styles.actionSheetDescription}>
                                {actionDescription}
                            </Text>

                            <TouchableOpacity
                                activeOpacity={0.9}
                                style={styles.actionSheetPrimaryButton}
                                onPress={handleRequestChange}
                            >
                                <Ionicons
                                    name={editableType === 'cover' ? 'image-outline' : 'person-circle-outline'}
                                    size={18}
                                    color="#fff"
                                />
                                <Text style={styles.actionSheetPrimaryText}>{actionLabel}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={styles.actionSheetGhostButton}
                                onPress={() => setShowActionSheet(false)}
                            >
                                <Text style={styles.actionSheetGhostText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    // Standard photo modal style
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.94)',
        justifyContent: 'center',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    topIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topIconPlaceholder: {
        width: 40,
        height: 40,
    },
    counterText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    carouselContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        pointerEvents: 'box-none',
    },
    imagePage: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    actionSheetLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        zIndex: 3,
    },
    actionSheetBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.18)',
    },
    actionSheet: {
        backgroundColor: '#111827',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    actionSheetHandle: {
        width: 42,
        height: 5,
        borderRadius: 3,
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.22)',
        marginBottom: 16,
    },
    actionSheetTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    actionSheetDescription: {
        color: 'rgba(255,255,255,0.68)',
        fontSize: 14,
        lineHeight: 20,
        marginTop: 6,
        marginBottom: 18,
    },
    actionSheetPrimaryButton: {
        height: 50,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionSheetPrimaryText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 8,
    },
    actionSheetGhostButton: {
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    actionSheetGhostText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },

    // Immersive Facebook Story View style
    storyOverlay: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'space-between',
    },
    gestureOverlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        zIndex: 2,
    },
    leftTapArea: {
        flex: 1,
    },
    centerSpace: {
        flex: 1,
    },
    rightTapArea: {
        flex: 1,
    },
    storyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 3,
        paddingHorizontal: 16,
    },
    progressRow: {
        flexDirection: 'row',
        gap: 4,
        width: '100%',
        marginBottom: 10,
    },
    progressBarBg: {
        height: 2,
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#fff',
    },
    storyUserInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    storyUserLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    storyAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#1877F2',
    },
    storyTextCol: {
        flexDirection: 'column',
    },
    storyUserName: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    storyTime: {
        color: 'rgba(255, 255, 255, 0.75)',
        fontSize: 11,
    },
    storyUserRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    storyCloseBtn: {
        padding: 4,
    },
    storyCarousel: {
        flex: 1,
        zIndex: 1,
    },
    storyImagePage: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    storyFullImage: {
        width: '100%',
        height: '100%',
    },
    storyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 3,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    reactionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    reactionItem: {
        padding: 4,
    },
    reactionEmoji: {
        fontSize: 24,
    },
    storyInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    storyInput: {
        flex: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        color: '#fff',
        fontSize: 14,
    },
    sendIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
