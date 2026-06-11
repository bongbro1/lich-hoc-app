import React, { useCallback, useMemo } from 'react';
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
import { SCREENS } from '../configs/constants';

// Import extracted components and logic
import ProfileTabButton from '../components/profile/ProfileTabButton';
import ProfileFeedSkeleton, { PostItemsSkeleton } from '../components/profile/ProfileFeedSkeleton';
import ProfileHeader from '../components/profile/ProfileHeader';
import CreatePostSection from '../components/profile/CreatePostSection';
import ProfileBioSection from '../components/profile/ProfileBioSection';
import ProfileFriendsSection from '../components/profile/ProfileFriendsSection';
import { useProfileFeedLogic } from '../hooks/useProfileFeedLogic';

export default function ProfileFeedScreen({ route, navigation }: ProfileFeedScreenProps) {
    const { darkMode } = useUser();
    const { openModal } = useImageFullModal();
    const p = route.params ?? {};
    const { studentId, initialProfile } = p;

    // Use our custom logic hook
    const logic = useProfileFeedLogic(studentId, navigation, initialProfile);

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

    const theme = useMemo(() => ({
        bg: darkMode ? '#0F172A' : '#F0F2F5',
        card: darkMode ? '#1E293B' : '#fff',
        text: darkMode ? '#F8FAFC' : Colors.text,
        textMuted: darkMode ? '#94A3B8' : Colors.subText,
        border: darkMode ? '#334155' : '#E2E8F0',
        divider: darkMode ? '#334155' : '#E2E8F0',
        input: darkMode ? '#334155' : '#f5f5f5',
    }), [darkMode]);

    const themedStyles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.bg,
        },
        keyboardAvoiding: {
            flex: 1,
            backgroundColor: theme.bg,
        },
        emptyContainer: {
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: 0.5,
        },
        tabRow: {
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderBottomColor: theme.border,
            borderBottomWidth: 0.5,
        }
    }), [theme]);

    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
        <PostItem
            post={item}
            itemIndex={index}
            onDelete={logic.handleDeletePost}
            onComposerFocus={logic.handleComposerFocus}
            onRequestCommentFocus={logic.handleRequestCommentFocus}
            refreshTrigger={logic.refreshTrigger}
        />
    ), [logic.handleDeletePost, logic.handleComposerFocus, logic.handleRequestCommentFocus, logic.refreshTrigger]);

    const renderEmpty = useCallback(() => {
        if (logic.loadingPosts) {
            return <PostItemsSkeleton />;
        }
        return (
            <View style={[styles.emptyContainer, themedStyles.emptyContainer]}>
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
        );
    }, [theme, darkMode, logic.isCurrentUser, logic.loadingPosts, themedStyles.emptyContainer]);

    const handleFilterAll = useCallback(() => logic.setActiveFilter("all"), [logic.setActiveFilter]);
    const handleFilterPhotos = useCallback(() => logic.setActiveFilter("photos"), [logic.setActiveFilter]);
    const handleFilterPosts = useCallback(() => logic.setActiveFilter("posts"), [logic.setActiveFilter]);
    const handleShowOptions = useCallback(() => logic.setShowOptions(true), [logic.setShowOptions]);

    if (logic.loadingPage) {
        return (
            <View style={themedStyles.container}>
                <SimpleHeader title="Trang cá nhân" loading={true} />
                <ProfileFeedSkeleton isCurrentUser={logic.isCurrentUser} displayStatus={logic.displayStatus} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={themedStyles.keyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={-20}
        >
            <SimpleHeader
                title={logic.profile?.name || "Trang cá nhân"}
                loading={false}
                onPressOptions={!logic.isCurrentUser ? handleShowOptions : undefined}
            />

            <FlatList
                ref={logic.flatListRef}
                style={[styles.container, themedStyles.container]}
                data={logic.posts}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                refreshing={logic.refreshing}
                onRefresh={logic.onRefresh}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
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
                        {/* ── Profile Header (Cover + Avatar + Name + Actions) ── */}
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
                            handleShowOptions={handleShowOptions}
                            handleAddFriend={logic.handleAddFriend}
                            handleAddStory={() => navigation.navigate(SCREENS.CREATE_STORY)}
                            handleDeleteStory={logic.handleDeleteStory}
                            stories={logic.stories}
                        />

                        {/* ── Bio / Giới thiệu Section ── */}
                        <ProfileBioSection
                            theme={theme}
                            darkMode={darkMode}
                            followersCount={logic.followersCount}
                            isCurrentUser={logic.isCurrentUser}
                            profile={logic.profile}
                            onEditPress={() => {
                                navigation.navigate(SCREENS.EDIT_PROFILE_DETAILS, {
                                    studentId: logic.profile?.studentId,
                                    initialProfile: logic.profile
                                });
                            }}
                        />

                        {/* ── Friends / Bạn bè Section ── */}
                        <ProfileFriendsSection
                            theme={theme}
                            darkMode={darkMode}
                            friendsCount={logic.friendsCount}
                            isCurrentUser={logic.isCurrentUser}
                            friends={logic.friendsList}
                            onViewAll={logic.handleViewAllFriends}
                            onPressFriend={logic.handleGoToUserProfile}
                        />

                        {/* ── Create Post (only for current user) ── */}
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
                                avatarUri={logic.avatarUri}
                            />
                        )}

                        {/* ── Posts Tab Bar ── */}
                        <View style={[styles.tabRow, themedStyles.tabRow]}>
                            <ProfileTabButton
                                label="Bài viết"
                                active={logic.activeFilter === "all"}
                                onPress={handleFilterAll}
                            />
                            <ProfileTabButton
                                label="Ảnh"
                                active={logic.activeFilter === "photos"}
                                onPress={handleFilterPhotos}
                            />
                            <ProfileTabButton
                                label="Reels"
                                active={logic.activeFilter === "posts"}
                                onPress={handleFilterPosts}
                            />
                        </View>
                    </View>
                }
                ListEmptyComponent={renderEmpty}
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
        flexDirection: 'row',
        borderBottomWidth: 0.5,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderCurve: 'continuous',
        marginTop: 8,
        marginHorizontal: 16,
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
