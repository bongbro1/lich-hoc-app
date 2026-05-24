import React from 'react';
import { View, Text, FlatList, StyleSheet, KeyboardAvoidingView, useWindowDimensions, Platform, Dimensions } from 'react-native';
import SimpleHeader from '../components/SimpleHeader';
import { ProfileFeedScreenProps } from '../types/typesSocial';
import PostItem from '../components/PostItem';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { useUser } from '../contexts/UserContext';
import { calculateNumColumns } from '../components/ImageFullModal';
import { useImageFullModal } from '../contexts/ImageFullModalContext';
import BottomActionSheet from '../components/BottomActionSheet';

// Import extracted components and logic
import ProfileTabButton from '../components/profile/ProfileTabButton';
import ProfileFeedSkeleton from '../components/profile/ProfileFeedSkeleton';
import ProfileHeader from '../components/profile/ProfileHeader';
import CreatePostSection from '../components/profile/CreatePostSection';
import { useProfileFeedLogic } from '../hooks/useProfileFeedLogic';

export default function ProfileFeedScreen({ route, navigation }: ProfileFeedScreenProps) {
    const { darkMode } = useUser();
    const { openModal } = useImageFullModal();
    const p = route.params ?? {};
    const { studentId } = p;

    // Use our custom logic hook
    const logic = useProfileFeedLogic(studentId, navigation);

    // Calculate dimensions for images
    const windowWidth = useWindowDimensions().width - 40;
    const containerPadding = 24;
    const spacing = 8;
    const numColumns = calculateNumColumns({
        windowWidth: Dimensions.get('window').width,
        containerPadding: 16,
        paddingIsBothSides: true,
        spacing: 8,
        minImageWidth: 100,
        maxColumns: 5
    });
    const imageSize = (windowWidth - containerPadding * 2 - spacing * (numColumns - 1)) / numColumns;

    const theme = {
        bg: darkMode ? '#0F172A' : '#F5F7FB',
        card: darkMode ? '#1E293B' : '#fff',
        text: darkMode ? '#F8FAFC' : Colors.text,
        textMuted: darkMode ? '#94A3B8' : Colors.subText,
        border: darkMode ? '#334155' : '#F1F5F9',
        divider: darkMode ? '#334155' : '#eee',
        input: darkMode ? '#334155' : '#f5f5f5',
    };

    if (logic.loadingPage) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg }}>
                <SimpleHeader title="Trang cá nhân" loading={true} />
                <ProfileFeedSkeleton isCurrentUser={logic.isCurrentUser} displayStatus={logic.displayStatus} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.bg }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={-20}
        >
            <SimpleHeader
                title={logic.profile?.name || "Trang cá nhân"}
                loading={false}
                onPressOptions={!logic.isCurrentUser ? () => logic.setShowOptions(true) : undefined}
            />

            <FlatList
                ref={logic.flatListRef}
                style={[styles.container, { backgroundColor: theme.bg }]}
                data={logic.posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <PostItem
                        post={item}
                        itemIndex={index}
                        onDelete={() => logic.handleDeletePost(item.id)}
                        onComposerFocus={logic.handleComposerFocus}
                        onRequestCommentFocus={logic.handleRequestCommentFocus}
                        refreshTrigger={logic.refreshTrigger}
                    />
                )}
                refreshing={logic.refreshing}
                onRefresh={logic.onRefresh}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                onScroll={(event) => {
                    logic.scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
                onScrollToIndexFailed={(info) => {
                    logic.flatListRef.current?.scrollToOffset?.({
                        offset: Math.max(0, info.averageItemLength * info.index),
                        animated: true,
                    });

                    setTimeout(() => {
                        logic.flatListRef.current?.scrollToIndex?.({
                            index: info.index,
                            animated: true,
                            viewPosition: 0.12,
                        });
                    }, 150);
                }}
                ListHeaderComponent={
                    <View>
                        <ProfileHeader
                            isCurrentUser={logic.isCurrentUser}
                            studentName={logic.profile?.name}
                            avatarUri={logic.avatarUri}
                            coverUri={logic.coverUri}
                            major={logic.profile?.major}
                            friendsCount={logic.friendsCount}
                            followersCount={logic.followersCount}
                            followingCount={logic.followingCount}
                            displayStatus={logic.displayStatus}
                            config={logic.config}
                            darkMode={darkMode}
                            theme={theme}
                            openModal={openModal}
                            handleChangeAvatar={logic.handleChangeAvatar}
                            handleChangeCover={logic.handleChangeCover}
                            handleAcceptFriend={logic.handleAcceptFriend}
                            handleRejectFriend={logic.handleRejectFriend}
                            handleFriendPress={logic.handleFriendPress}
                            handleMessages={logic.handleMessages}
                            handleShowOptions={() => logic.setShowOptions(true)}
                            handleAddFriend={logic.handleAddFriend}
                        />

                        {logic.isCurrentUser && (
                            <CreatePostSection
                                theme={theme}
                                newPostContent={logic.newPostContent}
                                setNewPostContent={logic.setNewPostContent}
                                newPostImages={logic.newPostImages}
                                setNewPostImages={logic.setNewPostImages}
                                numColumns={numColumns}
                                spacing={spacing}
                                imageSize={imageSize}
                                openModal={openModal}
                                handlePickImage={logic.handlePickImage}
                                handleAddPost={logic.handleAddPost}
                                submitting={logic.submitting}
                            />
                        )}

                        <View style={[styles.tabRow, { backgroundColor: theme.card, borderBottomColor: theme.divider }]}>
                            <ProfileTabButton
                                label="Tất cả"
                                active={logic.activeFilter === "all"}
                                onPress={() => logic.setActiveFilter("all")}
                            />
                            <ProfileTabButton
                                label="Ảnh"
                                active={logic.activeFilter === "photos"}
                                onPress={() => logic.setActiveFilter("photos")}
                            />
                            <ProfileTabButton
                                label="Bài viết"
                                active={logic.activeFilter === "posts"}
                                onPress={() => logic.setActiveFilter("posts")}
                            />
                        </View>
                    </View>
                }
                ListEmptyComponent={() => (
                    <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: darkMode ? '#334155' : '#F8FAFC' }]}>
                            <Ionicons name="newspaper-outline" size={48} color={theme.textMuted} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Chưa có bài viết nào</Text>
                        <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                            {logic.isCurrentUser
                                ? "Hãy chia sẻ những khoảnh khắc hoặc suy nghĩ của bạn với mọi người nhé!"
                                : "Người dùng này hiện chưa có bài viết công khai nào."}
                        </Text>
                    </View>
                )}
            />

            <BottomActionSheet
                visible={logic.showOptions}
                onClose={() => logic.setShowOptions(false)}
                title="Hành động"
                actions={logic.actions}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        marginTop: 8,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});
