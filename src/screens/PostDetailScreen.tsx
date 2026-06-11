import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NotificationStackParamList } from '../navigation/types';
import PostItem from '../components/PostItem';
import SimpleHeader from '../components/SimpleHeader';
import { db } from '../configs/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { Colors } from '../utils/theme';
import { PostModel } from '../models/post';

type Props = NativeStackScreenProps<NotificationStackParamList, 'PostDetailScreen'>;

export default function PostDetailScreen({ route, navigation }: Props) {
    const { postId, focusComment } = route.params;
    const { darkMode } = useUser();
    const [post, setPost] = useState<PostModel | null>(null);
    const [loading, setLoading] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);

    const theme = {
        bg: darkMode ? '#1E293B' : '#faf8ff',
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'posts', postId));
                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() } as PostModel);
                }
            } catch (e) {
                console.log('Error fetching post for detail:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    const handleFocusComment = () => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <SimpleHeader
                title="Bài viết"
                showBackButton={true}
            />
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : post ? (
                <ScrollView
                    ref={scrollViewRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    <PostItem
                        post={post}
                        refreshTrigger={0}
                        onDelete={() => {
                            navigation.goBack();
                        }}
                        itemIndex={0}
                        onRequestCommentFocus={handleFocusComment}
                    />
                </ScrollView>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
