import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ImageBackground,
    StatusBar,
    SafeAreaView,
    Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Colors } from "../../utils/theme";
import { acceptCall, endCall, listenCall } from "../../services/callService";
import { CallUser } from "../../types/typesChat";
import { CallStackParamList } from "../../navigation/types";
import { createExitToChat } from "../../navigation/ChatNavigation";
import { useUser } from "../../contexts/UserContext";
import { userRepo } from "repositories/userRepo";

type Props = NativeStackScreenProps<
    CallStackParamList,
    "IncomingCall"
>;
export const IncomingCallScreen = ({ route, navigation }: Props) => {
    const { callId, callerId, calleeId, conversationId, __from, callType } = route.params;
    const [callerUser, setCallerUser] = useState<CallUser | null>(null);
    const { user: currentUser } = useUser();

    const ringtoneRef = useRef<Audio.Sound | null>(null);

    const playRingtone = async () => {
        try {

            if (ringtoneRef.current) return;
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
            });

            const { sound } = await Audio.Sound.createAsync(
                require("../../../assets/sounds/ringtone.mp3"),
                {
                    isLooping: true,
                    volume: 1.0,
                }
            );

            ringtoneRef.current = sound;
            await sound.playAsync();
        } catch (e) {
            console.log("❌ Play ringtone error:", e);
        }
    };

    const stopRingtone = async () => {
        try {
            if (ringtoneRef.current) {
                const sound = ringtoneRef.current;
                ringtoneRef.current = null; // Nullify immediately to prevent multiple calls
                await sound.stopAsync();
                await sound.unloadAsync();
            }
            // 🚀 Reset audio mode to prevent conflict with Agora
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
            });
        } catch (e) {
            console.log("❌ Stop ringtone error:", e);
        }
    };

    useEffect(() => {
        if (__from === "notification") {
            playRingtone();
        }

        return () => {
            stopRingtone();
        };
    }, [__from]);

    useEffect(() => {
        userRepo.getUserById(callerId).then((u) => {
            if (!u) return;
            setCallerUser({
                studentId: u.studentId,
                name: u.name,
                avatar: u.avatar ?? "",
            });
        });
    }, [callerId]);

    const partnerUser = useMemo(() => {
        if (!currentUser || !callerUser) return null;

        return currentUser.studentId === callerUser.studentId
            ? null
            : callerUser;
    }, [currentUser, callerUser]);

    const returnTo = useMemo(() => {
        if (!partnerUser) return null;

        const partnerWithStatus = {
            ...partnerUser,
            onlineStatus: "Đang hoạt động",
        };

        return {
            name: "ChatDetailScreen",
            params: {
                user: partnerWithStatus,
                currentUser,
                conversationId,
                __from: "call",
            },
        };
    }, [partnerUser, currentUser, conversationId]);


    const exitToChat = useMemo(() => {
        if (!returnTo) return null;
        return createExitToChat(returnTo);
    }, [returnTo]);


    useEffect(() => {
        if (!callerUser) return;

        // Auto-end call after 65 seconds (slightly longer than caller timeout)
        const timeoutId = setTimeout(() => {
            console.log("Incoming call timed out");
            handleDecline();
        }, 65000);

        const unsub = listenCall(callId, (call) => {
            if (!call) return;

            if (call.status === "ended" && exitToChat) {
                clearTimeout(timeoutId);
                stopRingtone();
                exitToChat();
            }

            if (call.status === "accepted") {
                clearTimeout(timeoutId);
                navigation.navigate("InCall", {
                    callId,
                    partnerUser: callerUser,
                    conversationId,
                    callType
                });
            }
        });

        return () => {
            clearTimeout(timeoutId);
            unsub();
        };
    }, [callId, callerUser]);

    const handleAccept = async () => {
        // Request permissions for receiver
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: audioStatus } = await Audio.requestPermissionsAsync();

        if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
            Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền camera và micro để tham gia cuộc gọi.');
            return;
        }

        await acceptCall(callId);
        stopRingtone();
    };

    const handleDecline = async () => {
        await endCall(callId);
        stopRingtone();
    };

    if (!callerUser) return null;

    return (
        <View style={styles.background}>
            <Image
                source={{ uri: callerUser.avatar }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.overlay}>
                <SafeAreaView style={styles.container}>

                    {/* Top Section: Avatar & Info */}
                    <View style={styles.topSection}>
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: callerUser.avatar }} style={styles.avatar} />
                            <View style={styles.ripple1} />
                            <View style={styles.ripple2} />
                        </View>
                        <Text style={styles.name}>{callerUser.name}</Text>
                        <Text style={styles.status}>
                            {callType === 'video' ? 'Cuộc gọi video đến...' : 'Cuộc gọi thoại đến...'}
                        </Text>
                    </View>

                    {/* Bottom Section: Actions */}
                    <View style={styles.bottomSection}>
                        <View style={styles.actions}>
                            {/* Decline */}
                            <View style={styles.actionItem}>
                                <TouchableOpacity
                                    onPress={handleDecline}
                                    activeOpacity={0.8}
                                    style={[styles.actionButton, styles.declineButton]}
                                >
                                    <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.actionText}>Từ chối</Text>
                            </View>

                            {/* Accept */}
                            <View style={styles.actionItem}>
                                <TouchableOpacity
                                    onPress={handleAccept}
                                    activeOpacity={0.8}
                                    style={[styles.actionButton, styles.acceptButton]}
                                >
                                    <MaterialCommunityIcons name="phone" size={32} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.actionText}>Trả lời</Text>
                            </View>
                        </View>
                    </View>

                </SafeAreaView>
            </View>
        </View>
    );
};

export default IncomingCallScreen;

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#1a1a1a",
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.55)", // Dark overlay for contrast
    },
    container: {
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
    },
    topSection: {
        alignItems: "center",
        marginTop: 60,
    },
    avatarContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 30,
        width: 140,
        height: 140,
    },
    avatar: {
        width: 130,
        height: 130,
        borderRadius: 65,
        zIndex: 10,
    },
    ripple1: {
        position: "absolute",
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    ripple2: {
        position: "absolute",
        width: 170,
        height: 170,
        borderRadius: 85,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
    name: {
        fontSize: 28,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    status: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.7)",
        fontWeight: "500",
    },
    bottomSection: {
        width: "100%",
        paddingBottom: 60,
    },
    actions: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-evenly",
        paddingHorizontal: 20,
    },
    actionItem: {
        alignItems: "center",
    },
    actionButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    actionText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
    acceptButton: {
        backgroundColor: "#34C759", // Apple green / FB green
        shadowColor: "#34C759",
    },
    declineButton: {
        backgroundColor: "#FF3B30", // Apple red / FB red
        shadowColor: "#FF3B30",
    },
});
