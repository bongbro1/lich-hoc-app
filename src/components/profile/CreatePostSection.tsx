import React from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Image, Pressable, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    submitting
}: CreatePostSectionProps) {
    return (
        <View style={[styles.createPostContainer, { backgroundColor: theme.card }]}>
            <View style={styles.createPostTop}>
                <View style={styles.createPostMiddle}>
                    <TextInput
                        placeholder="Bạn đang nghĩ gì?"
                        placeholderTextColor={theme.textMuted}
                        value={newPostContent}
                        onChangeText={setNewPostContent}
                        style={[styles.createPostInput, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                        multiline
                        underlineColorAndroid="transparent"
                    />

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
                                            resizeMode="cover"
                                        />
                                    </Pressable>
                                    <Pressable
                                        style={({ pressed }) => [styles.removeImageBtn, { opacity: pressed ? 0.6 : 1 }]}
                                        onPress={() => setNewPostImages(prev => prev.filter(i => i !== item))}
                                    >
                                        <Ionicons name="close" size={16} color="#fff" />
                                    </Pressable>
                                </View>
                            )}
                        />
                    )}

                    <View style={styles.createPostActions}>
                        <Pressable
                            style={({ pressed }) => [styles.pickImageButton, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                            onPress={handlePickImage}
                        >
                            <Ionicons name="image-outline" size={20} color={Colors.primary} style={{ marginRight: 6 }} />
                            <Text style={styles.pickImageButtonText}>Chọn ảnh</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [styles.postButton, (submitting || pressed) && { opacity: 0.8 }, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                            onPress={handleAddPost}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.postButtonText}>Đăng bài</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    createPostContainer: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    createPostTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    createPostMiddle: { flex: 1 },
    createPostInput: {
        width: '100%',
        flex: 1,
        minHeight: 100,
        maxHeight: 130,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignSelf: 'flex-start',
        fontSize: 16,
        textAlignVertical: 'top',
        textDecorationLine: 'none',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 2,
    },
    createPostActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    pickImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    pickImageButtonText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    postButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    postButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
});
