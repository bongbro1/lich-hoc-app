import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useUser } from '../../contexts/UserContext';
import Skeleton from '../../types/Skeleton';
import { FriendRelationStatus } from '../../models/friend';

export default function ProfileFeedSkeleton({ isCurrentUser, displayStatus }: { isCurrentUser?: boolean; displayStatus?: FriendRelationStatus }) {
    const { darkMode } = useUser();
    const theme = {
        bg: darkMode ? '#0F172A' : '#F5F7FB',
        card: darkMode ? '#1E293B' : '#fff',
        border: darkMode ? '#334155' : '#F1F5F9',
        divider: darkMode ? '#334155' : '#eee',
        input: darkMode ? '#334155' : '#f5f5f5',
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <Skeleton height={140} radius={0} style={styles.cover} />

            {/* Header Skeleton */}
            <View style={[styles.headerSkeleton, { backgroundColor: theme.card }]}>
                {/* Avatar */}
                <Skeleton width={120} height={120} radius={60} style={[styles.avatar_large, { borderColor: theme.card }]} />

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
                        <Skeleton width={70} height={16} radius={6} />
                        <View style={[styles.dotSeparator, { backgroundColor: theme.border }]} />
                        <Skeleton width={60} height={16} radius={6} />
                    </View>
                </View>

                {/* Action Buttons Row */}
                {!isCurrentUser && (
                    <View style={styles.actionRow}>
                        <View style={styles.dualButtonRow}>
                            <Skeleton width="48%" height={42} radius={12} />
                            <Skeleton width="48%" height={42} radius={12} />
                        </View>
                    </View>
                )}
            </View>

            {/* Create post skeleton */}
            {isCurrentUser && (
                <View style={[styles.createPostContainer, { backgroundColor: theme.card, marginTop: 12, marginHorizontal: 0, borderRadius: 0 }]}>
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
            <View style={[styles.tabRow, { backgroundColor: theme.card, borderBottomColor: theme.divider, marginTop: isCurrentUser ? 0 : 12 }]}>
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
        paddingBottom: 24,
    },
    cover: {
        width: '100%',
    },
    headerSkeleton: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    avatar_large: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        marginTop: -80,
        marginLeft: -6
    },
    infoContainer: {
        marginTop: 10,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        paddingVertical: 4,
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        marginHorizontal: 10,
    },
    actionRow: {
        marginTop: 20,
    },
    dualButtonRow: {
        flexDirection: 'row',
        gap: 8,
    },
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
    createPostActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    tabRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
    },
    postContainer: {
        padding: 12,
        marginBottom: 10,
        borderRadius: 12
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postActionsRow: {
        flexDirection: 'row',
        paddingTop: 4,
        borderTopWidth: 1,
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
