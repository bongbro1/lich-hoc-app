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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
}

export const ImageFullModal: React.FC<ImageFullModalProps> = ({
    visible,
    onClose,
    images,
    initialIndex = 0,
    editableType,
    onRequestChange,
}) => {
    const flatListRef = useRef<FlatList<string>>(null);
    const { width, height } = Dimensions.get('window');
    const [ratios, setRatios] = useState<Record<string, number>>({});
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!visible) {
            setShowActionSheet(false);
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
        if (!onRequestChange) {
            return;
        }

        setShowActionSheet(true);
    };

    const handleRequestChange = () => {
        setShowActionSheet(false);
        onClose();
        onRequestChange?.();
    };

    const actionLabel =
        editableType === 'cover'
            ? 'Đổi ảnh bìa'
            : 'Đổi ảnh đại diện';

    const actionDescription =
        editableType === 'cover'
            ? 'Chọn ảnh mới để cập nhật ảnh bìa.'
            : 'Chọn ảnh mới để cập nhật ảnh đại diện.';

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
                        <Ionicons name="close" size={26} color="#fff" />
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
                            <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
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
                                <View style={[styles.imagePage, { width }]}>
                                    <Image
                                        source={{ uri: item }}
                                        style={{
                                            width: width - 16,
                                            aspectRatio: ratios[item] || 1,
                                            maxHeight: height * 0.76,
                                        }}
                                        resizeMode="contain"
                                    />
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
        backgroundColor: '#2563eb',
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
});
