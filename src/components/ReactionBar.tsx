import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { ReactionType } from 'models/post';
import { useUser } from 'contexts/UserContext';

type ReactionIconMeta = {
  key: string;
  color: string;
  buttonBg: string;
  badgeBg: string;
  label: string;
  iconFamily: 'ionicons' | 'material';
  iconName: string;
  iconColor: string;
  iconSize: number;
};
export const reactionIcons: Record<ReactionType, ReactionIconMeta> = {
  like: {
    key: 'like',
    color: '#1877f2',
    buttonBg: '#e8f1ff',
    badgeBg: '#1877f2',
    label: 'Thích',
    iconFamily: 'ionicons',
    iconName: 'thumbs-up',
    iconColor: '#fff',
    iconSize: 13,
  },
  love: {
    key: 'love',
    color: '#f43f5e',
    buttonBg: '#ffe8ee',
    badgeBg: '#f43f5e',
    label: 'Yêu thích',
    iconFamily: 'ionicons',
    iconName: 'heart',
    iconColor: '#fff',
    iconSize: 14,
  },
  haha: {
    key: 'haha',
    color: '#f7b125',
    buttonBg: '#fff5d8',
    badgeBg: '#f7b125',
    label: 'Haha',
    iconFamily: 'material',
    iconName: 'emoticon-lol-outline',
    iconColor: '#6a4300',
    iconSize: 15,
  },
  wow: {
    key: 'wow',
    color: '#fb923c',
    buttonBg: '#ffeddc',
    badgeBg: '#fb923c',
    label: 'Wow',
    iconFamily: 'material',
    iconName: 'emoticon-excited-outline',
    iconColor: '#fff',
    iconSize: 15,
  },
  sad: {
    key: 'sad',
    color: '#60a5fa',
    buttonBg: '#e8f2ff',
    badgeBg: '#60a5fa',
    label: 'Buồn',
    iconFamily: 'material',
    iconName: 'emoticon-cry-outline',
    iconColor: '#fff',
    iconSize: 15,
  },
  angry: {
    key: 'angry',
    color: '#ef4444',
    buttonBg: '#ffe7e7',
    badgeBg: '#ef4444',
    label: 'Phẫn nộ',
    iconFamily: 'material',
    iconName: 'emoticon-angry-outline',
    iconColor: '#fff',
    iconSize: 15,
  },
  unreact: {
    key: 'unreact',
    color: '#64748b',
    buttonBg: '#eef2f7',
    badgeBg: '#64748b',
    label: 'Bỏ thích',
    iconFamily: 'ionicons',
    iconName: 'thumbs-up-outline',
    iconColor: '#fff',
    iconSize: 13,
  },
};

export const getReactionColor = (type: string) => {
  switch (type) {
    case 'like': return Colors.primary;
    case 'love': return '#F5533D';
    case 'haha': return '#F7B125';
    case 'wow': return '#FB923C';
    case 'sad': return '#60A5FA';
    case 'angry': return '#E4605A';
    default: return '#ddd';
  }
};

type ReactionGlyphProps = {
  type: ReactionType;
  size?: number;
  filled?: boolean;
};

export const ReactionGlyph: React.FC<ReactionGlyphProps> = ({
  type,
  size = 18,
  filled = true,
}) => {
  const meta = reactionIcons[type];
  const iconColor = filled ? meta.iconColor : meta.color;

  if (meta.iconFamily === 'material') {
    return (
      <MaterialCommunityIcons
        name={meta.iconName as any}
        size={size}
        color={iconColor}
      />
    );
  }

  return (
    <Ionicons
      name={meta.iconName as any}
      size={size}
      color={iconColor}
    />
  );
};

type ReactionBadgeProps = {
  type: ReactionType;
  size?: number;
  outlined?: boolean;
};

export const ReactionBadge: React.FC<ReactionBadgeProps> = ({
  type,
  size = 22,
  outlined = true,
}) => {
  const meta = reactionIcons[type];
  const badgePadding = Math.max(2, Math.round(size * 0.12));
  const iconSize = Math.max(10, Math.round(size * 0.52));

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: meta.badgeBg,
          padding: badgePadding,
        },
        outlined && styles.badgeOutlined,
      ]}
    >
      <ReactionGlyph type={type} size={iconSize} />
    </View>
  );
};

interface ReactionBarProps {
  onSelect: (type: ReactionType) => void;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({ onSelect }) => {
  const { darkMode } = useUser();
  const theme = {
    bg: darkMode ? '#334155' : '#fff',
    text: darkMode ? '#F8FAFC' : '#475569',
  };

  const visibleReactions = Object.entries(reactionIcons)
    .filter(([type]) => type !== 'unreact') as Array<[ReactionType, ReactionIconMeta]>;

  const animValues = useRef(
    visibleReactions.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = animValues.map((anim, index) =>
      Animated.spring(anim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        delay: index * 35,
        useNativeDriver: true,
      })
    );

    Animated.stagger(35, animations).start();
  }, [animValues]);

  return (
    <View style={[styles.reactionBar, { backgroundColor: theme.bg }]}>
      {visibleReactions.map(([type, meta], index) => {
        const translateY = animValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        });

        const opacity = animValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        return (
          <Animated.View
            key={type}
            style={{
              transform: [{ translateY }],
              opacity,
              marginHorizontal: 5,
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              onPress={() => onSelect(type)}
              style={[
                styles.reactionButton,
                { backgroundColor: meta.buttonBg },
              ]}
              activeOpacity={0.9}
            >
              <ReactionBadge type={type} size={34} outlined={false} />
            </TouchableOpacity>
            <Text style={[styles.reactionLabel, { color: theme.text }]}>{meta.label}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOutlined: {
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  reactionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  reactionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
});
