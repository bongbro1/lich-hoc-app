import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, View, Text, TouchableWithoutFeedback, Pressable, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

type PopupProps = {
    visible: boolean;
    title?: string;
    content: React.ReactNode;
    onClose: () => void;
    maxHeight?: number;
};

export default function PopupComponent({ visible, title, content, onClose, maxHeight }: PopupProps) {
    const screenHeight = Dimensions.get("window").height;
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [modalHeight, setModalHeight] = useState(0);

    useEffect(() => {
        if (modalHeight === 0) return;
        const minHeight = screenHeight * 0.5;
        const maxHeight = screenHeight * 0.8;
        const finalHeight = Math.max(modalHeight, minHeight);
        const usedHeight = Math.min(finalHeight, maxHeight);
        const finalPosition = (screenHeight - usedHeight) / 2 - usedHeight / 2;

        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: finalPosition, duration: 300, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: screenHeight, duration: 300, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();
        }
    }, [visible, modalHeight]);

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents={visible ? "auto" : "none"}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={StyleSheet.absoluteFillObject} />
            </TouchableWithoutFeedback>

            <Animated.View
                style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}
                onLayout={(event) => setModalHeight(event.nativeEvent.layout.height)}
            >
                <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6 }}>
                    {title && (
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                        </View>
                    )}
                    <View style={styles.content}>{content}</View>
                </ScrollView>

                <Pressable style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeText}>Đóng</Text>
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "white",
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 16,
        width: Math.min(Dimensions.get("window").width * 0.85, 350),
        minHeight: 300,
    },
    header: { marginBottom: 12 },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        flexShrink: 1, 
        flexWrap: "wrap",
        textAlign: 'center'
    },
    content: { flexGrow: 0 },
    closeIcon: {
        position: "absolute",
        top: 12,
        right: 12,
        padding: 4,
        zIndex: 10,
    },

    closeButton: {
        alignSelf: 'flex-end',
        backgroundColor: '#e53935',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginTop: 14
    },
    closeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
