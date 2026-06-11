import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useUser } from '../../contexts/UserContext';
import Skeleton from '../../types/Skeleton';
import { FriendRelationStatus } from '../../models/friend';

export default function ProfileFeedSkeleton({ isCurrentUser, displayStatus }: { isCurrentUser?: boolean; displayStatus?: FriendRelationStatus }) {
    const { darkMode } = useUser();
    const theme = {
        bg: darkMode ? '#0F172A' : '#F0F2F5',
        card: darkMode ? '#1E293B' : '#fff',
        border: darkMode ? '#334155' : '#E2E8F0',
        divider: darkMode ? '#334155' : '#E2E8F0',
        input: darkMode ? '#334155' : '#f5f5f5',
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
            {/* Cover Photo Skeleton */}
            <Skeleton height={192} radius={0} style={styles.cover} />

            {/* Header Skeleton */}
            <View style={[styles.headerSkeleton, { backgroundColor: theme.card }]}>
                {/* Avatar */}
                <View style={styles.avatarArea}>
                    <Skeleton width={152} height={152} radius={76} style={[styles.avatar_large, { borderColor: theme.card }]} />
                </View>

                <View style={styles.infoContainer}>
                    {/* Name & Badge */}
                    <View style={styles.nameRow}>
                        <Skeleton width={180} height={28} radius={8} />
                    </View>

                    {/* Major */}
                    <Skeleton width={140} height={16} radius={6} style={{ marginTop: 6 }} />

                    {/* Stats Row */}
                    <View style={styles.statsBar}>
                        <Skeleton width={50} height={16} radius={6} />
                        <View style={[styles.dotSeparator, { backgroundColor: theme.border }]} />
                        <Skeleton width={75} height={16} radius={6} />
                    </View>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionRow}>
                    {isCurrentUser ? (
                        <View style={styles.dualButtonRow}>
                            <Skeleton width="45%" height={40} radius={8} />
                            <Skeleton width="40%" height={40} radius={8} />
                            <Skeleton width={40} height={40} radius={8} />
                        </View>
                    ) : (
                        <View style={styles.dualButtonRow}>
                            <Skeleton width="45%" height={40} radius={8} />
                            <Skeleton width="40%" height={40} radius={8} />
                            <Skeleton width={40} height={40} radius={8} />
                        </View>
                    )}
                </View>
            </View>

            {/* Bio / Giới thiệu Section Skeleton */}
            <View style={[styles.bioContainer, { backgroundColor: theme.card, borderTopColor: theme.border, borderBottomColor: theme.border }]}>
                <Skeleton width={100} height={24} radius={6} style={{ marginBottom: 16 }} />
                <View style={styles.bioRowSkeleton}>
                    <Skeleton width={22} height={22} radius={11} style={{ marginRight: 12 }} />
                    <Skeleton width="70%" height={16} radius={6} />
                </View>
                <View style={styles.bioRowSkeleton}>
                    <Skeleton width={22} height={22} radius={11} style={{ marginRight: 12 }} />
                    <Skeleton width="60%" height={16} radius={6} />
                </View>
                <View style={styles.bioRowSkeleton}>
                    <Skeleton width={22} height={22} radius={11} style={{ marginRight: 12 }} />
                    <Skeleton width="80%" height={16} radius={6} />
                </View>
            </View>

            {/* Friends / Bạn bè Section Skeleton */}
            <View style={[styles.friendsContainer, { backgroundColor: theme.card, borderTopColor: theme.border, borderBottomColor: theme.border }]}>
                <View style={styles.friendsHeaderSkeleton}>
                    <View>
                        <Skeleton width={80} height={24} radius={6} />
                        <Skeleton width={100} height={14} radius={4} style={{ marginTop: 6 }} />
                    </View>
                    <Skeleton width={70} height={18} radius={6} />
                </View>
                <View style={styles.friendsGridSkeleton}>
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <View key={idx} style={styles.friendItemSkeleton}>
                            <Skeleton width="100%" height={100} radius={8} style={{ aspectRatio: 1 }} />
                            <Skeleton width="80%" height={12} radius={4} style={{ marginTop: 6 }} />
                        </View>
                    ))}
                </View>
            </View>

            {/* Create post skeleton */}
            {isCurrentUser && (
                <View style={[styles.createPostContainer, { backgroundColor: theme.card }]}>
                    <View style={styles.createPostTop}>
                        <View style={styles.createPostMiddle}>
                            <Skeleton width="100%" height={100} radius={16} />
                            <View style={styles.createPostActions}>
                                <Skeleton width={80} height={32} radius={20} />
                                <Skeleton width={80} height={32} radius={20} />
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* Tabs Skeleton */}
            <View style={[styles.tabRow, { backgroundColor: theme.card, borderBottomColor: theme.divider, marginTop: isCurrentUser ? 0 : 8 }]}>
                <View style={styles.tabBtn}>
                    <Skeleton width={60} height={16} radius={8} />
                </View>
                <View style={styles.tabBtn}>
                    <Skeleton width={40} height={16} radius={8} />
                </View>
                <View style={styles.tabBtn}>
                    <Skeleton width={60} height={16} radius={8} />
                </View>
            </View>

            {/* Post Items Skeleton */}
            <PostItemsSkeleton />
        </ScrollView>
    );
}

export function PostItemsSkeleton() {
    const { darkMode } = useUser();
    const theme = {
        card: darkMode ? '#1E293B' : '#fff',
        divider: darkMode ? '#334155' : '#E2E8F0',
    };
    return (
        <View style={{ paddingHorizontal: 0 }}>
            {[0, 1].map((item) => (
                <View key={item} style={[styles.postContainer, { backgroundColor: theme.card, marginTop: 8 }]}>
                    <View style={styles.postHeader}>
                        <Skeleton width={44} height={44} radius={22} style={{ marginRight: 10 }} />
                        <View style={{ flex: 1 }}>
                            <Skeleton width="40%" height={16} radius={8} />
                            <Skeleton width="25%" height={12} radius={6} style={{ marginTop: 6 }} />
                        </View>
                    </View>

                    <Skeleton height={15} radius={8} style={{ marginTop: 12, width: '90%' }} />
                    <Skeleton height={15} radius={8} style={{ marginTop: 8, width: '70%' }} />

                    <Skeleton height={200} radius={12} style={{ marginTop: 14 }} />

                    <View style={[styles.postActionsRow, { borderTopColor: theme.divider, marginTop: 12 }]}>
                        <View style={styles.postActionItem}>
                            <View style={styles.postAction}>
                                <Skeleton width={60} height={20} radius={10} />
                            </View>
                        </View>
                        <View style={styles.postActionItem}>
                            <View style={styles.postAction}>
                                <Skeleton width={60} height={20} radius={10} />
                            </View>
                        </View>
                        <View style={styles.postActionItem}>
                            <View style={styles.postAction}>
                                <Skeleton width={40} height={20} radius={10} />
                            </View>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    cover: {
        width: '100%',
    },
    headerSkeleton: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    avatarArea: {
        marginTop: -84, // Trùng với AVATAR_OVERLAP = 84 trong ProfileHeader
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    avatar_large: {
        width: 152, // Trùng với AVATAR_SIZE = 152 trong ProfileHeader
        height: 152,
        borderRadius: 76,
        borderWidth: 4,
    },
    infoContainer: {
        marginTop: 4,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        marginHorizontal: 8,
    },
    actionRow: {
        marginTop: 14,
    },
    dualButtonRow: {
        flexDirection: 'row',
        gap: 8,
    },
    bioContainer: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5,
    },
    bioRowSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    friendsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5,
    },
    friendsHeaderSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    friendsGridSkeleton: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    friendItemSkeleton: {
        width: '31%',
    },
    createPostContainer: {
        padding: 12,
        marginBottom: 8,
    },
    createPostTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    createPostMiddle: { flex: 1 },
    createPostActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    tabRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        marginBottom: 8,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
    },
    postContainer: {
        padding: 12,
        marginBottom: 10,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postActionsRow: {
        flexDirection: 'row',
        paddingTop: 4,
        borderTopWidth: 0.5,
    },
    postActionItem: {
        flex: 1,
    },
    postAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
    },
});
