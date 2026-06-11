import React from 'react';
import { View, TextInput, FlatList, Pressable, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/theme';
import { UploadImageModel } from '../../models/post';

type CreatePostSectionProps = {
    theme: any;
    newPostContent: string;
    setNewPostContent: (content: string) => void;
    newPostImages: UploadImageModel[];
    setNewPostImages: React.Dispatch<React.SetStateAction<UploadImageModel[]>>;
    numColumns: number;
    spacing: number;
    imageSize: number;
    openModal: (uris: string[], index: number) => void;
    handlePickImage: () => void;
    handleAddPost: () => void;
    submitting: boolean;
    avatarUri?: string | null;
};

export default function CreatePostSection({
    theme,
    newPostContent,
    setNewPostContent,
    newPostImages,
    setNewPostImages,
    numColumns,
    spacing,
    imageSize,
    openModal,
    handlePickImage,
    handleAddPost,
    submitting,
    avatarUri,
}: CreatePostSectionProps) {
    return (
        <View style={[styles.createPostContainer, { backgroundColor: theme.card, borderTopWidth: 0.5, borderTopColor: theme.border, borderBottomWidth: 0.5, borderBottomColor: theme.border }]}>
            {/* Top row: Avatar + pill input */}
            <View style={styles.topRow}>
                <Image
                    source={{ uri: avatarUri || 'https://via.placeholder.com/150' }}
                    style={styles.avatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                />
                <Pressable
                    style={[styles.inputPill, { backgroundColor: theme.bg, borderColor: theme.border }]}
                    onPress={() => { }}
                >
                    <TextInput
                        placeholder="Bạn đang nghĩ gì?"
                        placeholderTextColor={theme.textMuted}
                        value={newPostContent}
                        onChangeText={setNewPostContent}
                        style={[styles.inputText, { color: theme.text }]}
                        multiline
                        underlineColorAndroid="transparent"
                    />
                </Pressable>
            </View>

            {/* Images preview */}
            {newPostImages.length > 0 && (
                <FlatList
                    data={newPostImages}
                    keyExtractor={(item, index) => item.uri + index}
                    numColumns={numColumns}
                    columnWrapperStyle={{ justifyContent: 'flex-start', gap: spacing, marginBottom: spacing }}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    renderItem={({ item, index }) => (
                        <View style={{ width: imageSize, height: imageSize, marginTop: 10 }}>
                            <Pressable
                                onPress={() => openModal(newPostImages.map(img => img.uri), index)}
                                style={({ pressed }) => [{ width: '100%', height: '100%', opacity: pressed ? 0.9 : 1 }]}
                            >
                                <Image
                                    source={{ uri: item.uri }}
                                    style={{ width: '100%', height: '100%', borderRadius: 8 }}
                                    contentFit="cover"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                />
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [styles.removeImageBtn, { opacity: pressed ? 0.6 : 1 }]}
                                onPress={() => setNewPostImages(prev => prev.filter(i => i !== item))}
                            >
                                <MaterialIcons name="close" size={16} color="#fff" />
                            </Pressable>
                        </View>
                    )}
                />
            )}

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Action buttons row - Live / Photo / Event / Post */}
            <View style={styles.actionsRow}>
                <Pressable
                    style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => { }}
                >
                    <MaterialIcons name="videocam" size={22} color="#F3425F" />
                    <Text style={[styles.actionBtnText, { color: theme.textMuted }]}>Trực tiếp</Text>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={handlePickImage}
                >
                    <MaterialIcons name="photo-library" size={22} color="#45BD62" />
                    <Text style={[styles.actionBtnText, { color: theme.textMuted }]}>Ảnh</Text>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.postBtn,
                        { backgroundColor: Colors.primary, transform: [{ scale: pressed ? 0.97 : 1 }] }
                    ]}
                    onPress={handleAddPost}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.postBtnText}>Đăng bài</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    createPostContainer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    inputPill: {
        flex: 1,
        borderWidth: 0.5,
        borderRadius: 12,
        borderCurve: 'continuous',
        paddingHorizontal: 14,
        paddingVertical: 6,
        minHeight: 48,
        justifyContent: 'center',
    },
    inputText: {
        fontSize: 15,
        lineHeight: 22,
        textDecorationLine: 'none',
    },
    divider: {
        height: 0.5,
        marginBottom: 10,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    postBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderCurve: 'continuous',
        alignItems: 'center',
        justifyContent: 'center',
    },
    postBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 2,
    },
});
