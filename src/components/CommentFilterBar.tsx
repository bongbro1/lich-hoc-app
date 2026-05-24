import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../utils/theme";

interface CommentFilterBarProps {
    onChange?: (key: string) => void;
}

const FILTERS = [
    { key: "all", label: "Tất cả" },
    { key: "withImage", label: "Có ảnh" },
    { key: "withReaction", label: "Có cảm xúc" },
    { key: "withReply", label: "Có trả lời" },
];

export default function CommentFilterBar({ onChange }: CommentFilterBarProps) {
    const [active, setActive] = useState("all");
    const handlePress = (key: string) => {
        setActive(key);
        onChange && onChange(key);
    };

    return (
        <View style={styles.container}>
            {FILTERS.map((item) => (
                <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.8}
                    onPress={() => handlePress(item.key)}
                    style={[styles.tab, active === item.key && styles.tabActive]}
                >
                    <Text style={[styles.label, active === item.key && styles.labelActive]}>
                        {item.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        paddingHorizontal: 10,
        marginVertical: 8,
    },
    tab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#eee",
        borderRadius: 14,
        marginRight: 8,
    },
    tabActive: {
        backgroundColor: Colors.primary,
    },
    label: {
        color: "#444",
        fontSize: 13,
    },
    labelActive: {
        color: "#fff",
        fontWeight: "600",
    },
});
