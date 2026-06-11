import { useState, useEffect, useRef, useCallback } from 'react';
import { TextInput, FlatList, Dimensions, Keyboard, StatusBar, Platform, InteractionManager } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useUser } from '../contexts/UserContext';
import { useUserVM } from '../viewmodels/useUserVM';
import { usePostVM } from '../viewmodels/usePostVM';
import { useFriendVM } from '../viewmodels/useFriendVM';
import { PostModel, UploadImageModel } from '../models/post';
import { FriendRelationStatus, FRIEND_UI } from '../models/friend';
import storageService, { STORAGE_KEYS } from '../services/storageService';
import { userRepo } from '../repositories/userRepo';
import { imgbbService } from '../services/imgbbService';
import { SCREENS } from '../configs/constants';

export const useProfileFeedLogic = (studentId: string | undefined, navigation: any, initialProfile?: any) => {
    const { user: currentUser, setUser } = useUser();
    const flatListRef = useRef<FlatList<PostModel> | null>(null);
    const scrollOffsetRef = useRef(0);
    const keyboardHeightRef = useRef(0);
    const activeComposerInputRef = useRef<TextInput | null>(null);

    const isCurrentUser = studentId === currentUser?.studentId;
    const DEFAULT_COVER_URL = 'https://picsum.photos/800/300';

    const [newPostImages, setNewPostImages] = useState<UploadImageModel[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [loadingPage, setLoadingPage] = useState(!isCurrentUser && !initialProfile);
    const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
    const [localCoverUri, setLocalCoverUri] = useState(DEFAULT_COVER_URL);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [optimisticStatus, setOptimisticStatus] = useState<FriendRelationStatus | null>(null);
    const [activeFilter, setActiveFilter] = useState("all");
    const [showOptions, setShowOptions] = useState(false);
    const [stories, setStories] = useState<any[]>([]);

    const {
        profile,
        loadProfile,
        loadCounts,
    } = useUserVM();

    const displayProfile = isCurrentUser ? { ...currentUser, ...profile } : (profile || initialProfile || null);

    const {
        posts,
        setPosts,
        createPost,
        loadPosts,
        deletePost,
        submitting,
        loading: loadingPosts,
    } = usePostVM(studentId);

    const {
        relation,
        sendFriendRequest,
        accept,
        reject,
        cancel,
        unfriend,
        listenRelation,
        blockUser,
        unblockUser,
        friendsCount,
        followersCount,
        followingCount,
        listenFriends,
        listenFollowers,
        listenFollowing,
        fetchRelation,
        friendIds,
    } = useFriendVM();

    const [friendsList, setFriendsList] = useState<any[]>([]);

    useEffect(() => {
        if (!friendIds || friendIds.length === 0) {
            setFriendsList([]);
            return;
        }

        let active = true;
        const fetchFriends = async () => {
            try {
                const details = await userRepo.getUsersByIds(friendIds);
                if (active) {
                    setFriendsList(details);
                }
            } catch (err) {
                console.error("Failed to fetch friends profiles:", err);
            }
        };

        fetchFriends();
        return () => {
            active = false;
        };
    }, [friendIds]);

    const handleViewAllFriends = useCallback(() => {
        navigation.navigate(SCREENS.FRIENDS);
    }, [navigation]);

    const handleGoToUserProfile = useCallback((targetStudentId: string) => {
        if (!targetStudentId) return;
        navigation.push('ProfileFeedScreen', { studentId: targetStudentId });
    }, [navigation]);

    const avatarUri = localAvatarUri ?? displayProfile?.avatar ?? currentUser?.avatar;
    const coverUri = localCoverUri ?? displayProfile?.cover ?? currentUser?.cover ?? DEFAULT_COVER_URL;
    const displayStatus = optimisticStatus ?? relation.status ?? 'unknown';
    const config = FRIEND_UI[displayStatus];

    useEffect(() => {
        setLocalAvatarUri(displayProfile?.avatar ?? currentUser?.avatar ?? null);
    }, [displayProfile?.avatar, currentUser?.avatar]);

    useEffect(() => {
        setLocalCoverUri(displayProfile?.cover ?? currentUser?.cover ?? DEFAULT_COVER_URL);
    }, [displayProfile?.cover, currentUser?.cover]);

    useEffect(() => {
        if (displayProfile?.stories) {
            setStories(displayProfile.stories);
        }
    }, [displayProfile?.stories]);

    useEffect(() => {
        if (!studentId || !currentUser?.studentId) return;

        const unsub1 = listenFriends(studentId);
        const unsub2 = listenFollowers(studentId);
        const unsub3 = listenFollowing(studentId);

        let unsub4: (() => void) | undefined;
        if (!isCurrentUser) {
            unsub4 = listenRelation(currentUser.studentId, studentId);
        }

        return () => {
            unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.();
        };
    }, [studentId, currentUser?.studentId, isCurrentUser]);

    const handleLoadProfile = async () => {
        if (!studentId) return;
        await loadProfile(studentId);
    };

    const fetchPosts = async () => {
        try { await loadPosts(); } catch (error) { console.error('Error fetching posts:', error); }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setNewPostImages([]);
        await Promise.all([
            handleLoadProfile(),
            fetchPosts(),
            (!isCurrentUser && currentUser?.studentId && studentId)
                ? fetchRelation(currentUser.studentId, studentId)
                : Promise.resolve()
        ]);
        setRefreshing(false);
        setRefreshTrigger(prev => prev + 1);
    };

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            if (!studentId) return;

            // Start fetching immediately on mount concurrently
            const profilePromise = handleLoadProfile();
            const postsPromise = fetchPosts();
            const relationPromise = (!isCurrentUser && currentUser?.studentId && studentId)
                ? fetchRelation(currentUser.studentId, studentId)
                : Promise.resolve();

            // Await ONLY profile data (if we don't have initialProfile) to render instantly.
            // Do NOT block on relationPromise; the friend button will show a clean spinner loading indicator in the button itself.
            if (!initialProfile) {
                await profilePromise;
            }

            if (mounted) {
                setLoadingPage(false);
            }

            // Remaining tasks continue loading in the background
            await postsPromise;
        };
        init();
        return () => {
            mounted = false;
        };
    }, [studentId, currentUser?.studentId, isCurrentUser]);

    useEffect(() => {
        if (!navigation || !studentId) return;
        const unsubscribe = navigation.addListener('focus', () => {
            handleLoadProfile();
        });
        return unsubscribe;
    }, [navigation, studentId]);

    // Sync fetched profile details back to local UserContext and storage for instant subsequent mounts
    useEffect(() => {
        if (isCurrentUser && profile) {
            setUser(prev => {
                if (!prev) return prev;
                if (
                    prev.work === profile.work &&
                    JSON.stringify(prev.education) === JSON.stringify(profile.education) &&
                    prev.currentCity === profile.currentCity &&
                    prev.hometown === profile.hometown &&
                    prev.relationship === profile.relationship &&
                    prev.socialLink === profile.socialLink &&
                    prev.showFollowers === profile.showFollowers
                ) {
                    return prev;
                }
                const updatedUser = {
                    ...prev,
                    work: profile.work,
                    education: profile.education,
                    currentCity: profile.currentCity,
                    hometown: profile.hometown,
                    relationship: profile.relationship,
                    socialLink: profile.socialLink,
                    showFollowers: profile.showFollowers,
                };
                storageService.set({ key: STORAGE_KEYS.USER, value: updatedUser });
                return updatedUser;
            });
        }
    }, [profile, isCurrentUser]);

    const resizeImage = async (uri: string) => {
        const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 600 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
        return result.uri;
    };

    // Load cached stories on mount
    useEffect(() => {
        const loadStories = async () => {
            if (!studentId) return;
            const cachedStoriesMap = await storageService.get({ key: "STORIES" });
            if (cachedStoriesMap && cachedStoriesMap[studentId]) {
                setStories(cachedStoriesMap[studentId]);
            }
        };
        loadStories();
    }, [studentId]);

    const handleAddStory = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Cần quyền truy cập thư viện ảnh để thêm vào tin!');
            return;
        }
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.9,
            });
            if (!result.canceled && result.assets?.[0]?.uri) {
                const localUri = result.assets[0].uri;
                alert('Đang xử lý ảnh và tải lên tin...');

                // 1. Resize ảnh
                const resized = await resizeImage(localUri);

                // 2. Upload lên ImgBB để lấy link HTTPS
                const fileName = `story_${studentId}_${Date.now()}.jpg`;
                const remoteUrl = await imgbbService.uploadImage(resized, fileName);

                if (!remoteUrl) {
                    alert('Lỗi tải ảnh lên server, vui lòng thử lại.');
                    return;
                }

                // 3. Cập nhật State & Firestore Database
                const newStory = { url: remoteUrl, createdAt: new Date().toISOString() };
                const updatedStories = [...stories, newStory];
                setStories(updatedStories);

                // Lưu vào Firestore
                await userRepo.updateProfile(studentId!, { stories: updatedStories });

                // 4. Lưu Local Storage
                const cached = await storageService.get({ key: "STORIES" }) || {};
                cached[studentId!] = updatedStories;
                await storageService.set({ key: "STORIES", value: cached });

                alert('Đã thêm ảnh vào tin thành công!');
            }
        } catch (error) {
            console.log("Error adding story:", error);
            alert('Có lỗi xảy ra khi thêm vào tin.');
        }
    };

    const handleDeleteStory = async (index: number) => {
        if (!studentId) return;
        try {
            const updatedStories = [...stories];
            updatedStories.splice(index, 1);
            setStories(updatedStories);

            // Lưu vào Firestore
            await userRepo.updateProfile(studentId, { stories: updatedStories });

            // Lưu Local Storage
            const cached = await storageService.get({ key: "STORIES" }) || {};
            cached[studentId] = updatedStories;
            await storageService.set({ key: "STORIES", value: cached });
        } catch (error) {
            console.log("Error deleting story:", error);
            alert('Có lỗi xảy ra khi xóa tin.');
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return alert('Cần quyền truy cập ảnh');
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 1 });
            if (!result.canceled && result.assets) {
                const images = await Promise.all(result.assets.map(async (asset, index) => {
                    const resizedUri = await resizeImage(asset.uri);
                    return { uri: resizedUri, name: `post_${Date.now()}_${index}.jpg`, type: "image/jpeg" };
                }));
                setNewPostImages(prev => [...prev, ...images]);
            }
        } catch (error) { console.log("Error picking images:", error); }
    };

    const handleChangeAvatar = async () => {
        if (!studentId || !isCurrentUser) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
        if (result.canceled || !result.assets?.[0]?.uri) return;
        const nextAvatarUrl = await userRepo.uploadAvatar(studentId, result.assets[0].uri);
        setLocalAvatarUri(nextAvatarUrl);
        setUser(prev => {
            if (!prev) return prev;
            const updatedUser = { ...prev, avatar: nextAvatarUrl };
            storageService.set({ key: STORAGE_KEYS.USER, value: updatedUser });
            return updatedUser;
        });
    };

    const handleChangeCover = async () => {
        if (!isCurrentUser || !studentId) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 7], quality: 0.9 });
        if (result.canceled || !result.assets?.[0]?.uri) return;
        const nextCoverUrl = await userRepo.uploadCover(studentId, result.assets[0].uri);
        setLocalCoverUri(nextCoverUrl);
        setUser(prev => {
            if (!prev) return prev;
            const updatedUser = { ...prev, cover: nextCoverUrl };
            storageService.set({ key: STORAGE_KEYS.USER, value: updatedUser });
            return updatedUser;
        });
    };

    const handleAddPost = async () => {
        Keyboard.dismiss();
        if (!newPostContent.trim() && newPostImages.length === 0) return;
        if (submitting) return;
        try {
            const uploadedImages = await Promise.all(newPostImages.map(async (img) => {
                const remoteUrl = await imgbbService.uploadImage(img.uri, img.name);
                return { ...img, uri: remoteUrl };
            }));
            const result = await createPost({
                userId: studentId!,
                studentName: profile?.name ?? currentUser?.name ?? '',
                avatarUri: avatarUri ?? null,
                content: newPostContent,
                images: uploadedImages,
            });
            if (result.success) {
                setNewPostContent('');
                setNewPostImages([]);
            }
        } catch (error) { console.error('Error creating post:', error); }
    };

    const handleAddFriend = async () => {
        if (!currentUser?.studentId || !profile?.studentId) return;
        setOptimisticStatus('pending_sent');
        await sendFriendRequest(currentUser.studentId, profile.studentId, currentUser.name);
    };

    const handleAcceptFriend = async () => {
        if (!currentUser?.studentId || !profile?.studentId || !relation.requestId) return;
        setOptimisticStatus('friends');
        await accept(relation.requestId, profile.studentId, currentUser.studentId, currentUser.name);
        await Promise.all([loadCounts(currentUser.studentId), loadCounts(profile.studentId)]);
    };

    const handleRejectFriend = async () => {
        if (!relation.requestId || !currentUser?.studentId || !profile?.studentId) return;
        setOptimisticStatus('none');
        await reject(relation.requestId, profile.studentId, currentUser.studentId);
    };

    const handleCancelFriend = async () => {
        if (!relation.requestId || !currentUser?.studentId || !profile?.studentId) return;
        setOptimisticStatus('none');
        await cancel(relation.requestId, currentUser.studentId, profile.studentId);
    };

    const handleMessages = () => {
        if (!profile) return;
        navigation.navigate(SCREENS.CHATS, {
            screen: SCREENS.CHAT_DETAIL,
            params: { user: { id: profile.studentId, name: profile.name, avatar: profile.avatar, studentId: profile.studentId } }
        });
    };

    const handleFriendPress = async () => {
        try {
            switch (config.action) {
                case 'add': await handleAddFriend(); break;
                case 'accept': await handleAcceptFriend(); break;
                case 'reject': await handleRejectFriend(); break;
                case 'cancel': await handleCancelFriend(); break;
                default: return;
            }
        } catch (e) { setOptimisticStatus(null); }
    };


    const handleRequestCommentFocus = useCallback((index: number) => {
        // Handled cleanly by measureAndScrollComposer on autoFocus to prevent scrolling conflicts
    }, []);

    const measureAndScrollComposer = useCallback((input: TextInput | null) => {
        if (!input) return;
        input.measureInWindow((x, y, width, height) => {
            const screenHeight = Dimensions.get('window').height;
            const keyboardTop = keyboardHeightRef.current > 0 ? screenHeight - keyboardHeightRef.current : screenHeight;
            const visibleBottom = keyboardTop - 20;
            const inputBottom = y + height;
            const overlap = inputBottom - visibleBottom;
            if (overlap <= 0) return;
            flatListRef.current?.scrollToOffset({ offset: Math.max(0, scrollOffsetRef.current + overlap + 28), animated: true });
        });
    }, []);

    const handleComposerFocus = useCallback((input: TextInput | null) => {
        activeComposerInputRef.current = input;
        setTimeout(() => measureAndScrollComposer(input), 150);
    }, [measureAndScrollComposer]);

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
            keyboardHeightRef.current = event.endCoordinates.height;
            setTimeout(() => measureAndScrollComposer(activeComposerInputRef.current), 60);
        });
        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            keyboardHeightRef.current = 0;
            activeComposerInputRef.current = null;
        });
        return () => { showSub.remove(); hideSub.remove(); };
    }, [measureAndScrollComposer]);

    const onRemoveFriend = async () => {
        if (!currentUser?.studentId || !profile?.studentId) return;
        await unfriend(currentUser.studentId, profile.studentId);
        await Promise.all([loadCounts(currentUser.studentId), loadCounts(profile.studentId)]);
    };

    const onBlock = async () => {
        if (!currentUser?.studentId || !profile?.studentId) return;
        try {
            if (relation.status === 'blocked_by_me') await unblockUser(currentUser.studentId, profile.studentId);
            else await blockUser(currentUser.studentId, profile.studentId);
            await handleLoadProfile();
        } catch (err) { console.error('Block error:', err); }
    };

    const handleDeletePost = useCallback(async (postId: string) => {
        if (!currentUser || postId == '') return;
        try {
            await deletePost(postId);
            setPosts(prev => prev.filter(post => post.id !== postId));
        } catch (e) { console.error(e); }
    }, [currentUser, deletePost, setPosts]);

    const actions = [
        ...(relation.status === 'friends' ? [{ label: 'Hủy kết bạn', onPress: onRemoveFriend, icon: 'person-remove' as const }] : []),
        ...(relation.status === 'pending_sent' ? [{ label: 'Hủy yêu cầu kết bạn', onPress: handleCancelFriend, icon: 'person-remove' as const }] : []),
        { label: relation.status === 'blocked_by_me' ? 'Bỏ chặn' : 'Chặn', color: '#FF3B30', onPress: onBlock, icon: 'block' as const },
    ];

    const filteredPosts = posts.filter((p) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'photos') return (p.images?.length ?? 0) > 0;
        if (activeFilter === 'posts') return (p.images?.length ?? 0) === 0;
        return true;
    });

    return {
        isCurrentUser,
        currentUser,
        profile: displayProfile,
        posts: filteredPosts,
        loadingPage,
        loadingPosts,
        refreshing,
        onRefresh,
        avatarUri,
        coverUri,
        friendsCount,
        followersCount,
        followingCount,
        displayStatus,
        config,
        showOptions,
        setShowOptions,
        actions,
        activeFilter,
        setActiveFilter,
        newPostContent,
        setNewPostContent,
        newPostImages,
        setNewPostImages,
        submitting,
        refreshTrigger,
        flatListRef,
        scrollOffsetRef,
        handlePickImage,
        handleAddStory,
        handleDeleteStory,
        handleChangeAvatar,
        handleChangeCover,
        handleAddPost,
        handleDeletePost,
        handleAcceptFriend,
        handleRejectFriend,
        handleFriendPress,
        handleMessages,
        handleRequestCommentFocus,
        handleComposerFocus,
        handleAddFriend,
        friendsList,
        handleViewAllFriends,
        handleGoToUserProfile,
        stories,
    };
};
