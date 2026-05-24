import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ImageBackground,
    StatusBar,
    SafeAreaView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { endCall, listenCall } from "../../services/callService";
import { CallStackParamList } from "../../navigation/types";
import { createExitToChat } from "../../navigation/ChatNavigation";

type Props = NativeStackScreenProps<CallStackParamList, "OutgoingCall">;

export const OutgoingCallScreen = ({ route, navigation }: Props) => {
    const { callId, partnerUser, conversationId, returnTo, callType } = route.params;

    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(callType === 'video'); 
    const [isMuted, setIsMuted] = useState(false);

    const exitToChat = useMemo(
        () =>
            createExitToChat({
                name: "ChatDetailScreen",
                params: returnTo.params,
            }),
        [returnTo]
    );

    useEffect(() => {
        if (!callId) return;

        // Auto-cancel call after 1 minute (60 seconds)
        const timeoutId = setTimeout(() => {
            console.log("Call timed out after 1 minute");
            handleCancelCall();
        }, 60000);

        const unsub = listenCall(callId, (call) => {
            if (!call) return;

            if (call.status === "accepted") {
                clearTimeout(timeoutId);
                navigation.navigate("InCall", { callId, partnerUser, conversationId, callType });
            }

            if (call.status === "ended") {
                clearTimeout(timeoutId);
                exitToChat();
            }
        });

        return () => {
            clearTimeout(timeoutId);
            unsub();
        };
    }, [callId]);

    const handleCancelCall = async () => {
        await endCall(callId);
    };

    return (
        <View style={styles.background}>
            <Image 
                source={{ uri: partnerUser.avatar }} 
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
                            <Image source={{ uri: partnerUser.avatar }} style={styles.avatar} />
                            <View style={styles.ripple1} />
                            <View style={styles.ripple2} />
                        </View>
                        <Text style={styles.name}>{partnerUser.name}</Text>
                        <Text style={styles.status}>Đang gọi...</Text>
                    </View>

                    {/* Bottom Section: Actions */}
                    <View style={styles.bottomSection}>
                        {/* Control Buttons */}
                        <View style={styles.controlsRow}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
                                onPress={() => setIsSpeakerOn(!isSpeakerOn)}
                            >
                                <Ionicons
                                    name={isSpeakerOn ? "volume-high" : "volume-medium"}
                                    size={28}
                                    color={isSpeakerOn ? "#000" : "#fff"}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={[styles.controlButton, isVideoOn && styles.controlButtonActive]}
                                onPress={() => setIsVideoOn(!isVideoOn)}
                            >
                                <Ionicons
                                    name={isVideoOn ? "videocam" : "videocam-off"}
                                    size={28}
                                    color={isVideoOn ? "#000" : "#fff"}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                                onPress={() => setIsMuted(!isMuted)}
                            >
                                <Ionicons
                                    name={isMuted ? "mic-off" : "mic"}
                                    size={28}
                                    color={isMuted ? "#000" : "#fff"}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* End Call Button */}
                        <View style={styles.endCallContainer}>
                            <TouchableOpacity
                                onPress={handleCancelCall}
                                activeOpacity={0.8}
                                style={styles.endButton}
                            >
                                <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                </SafeAreaView>
            </View>
        </View>
    );
};

export default OutgoingCallScreen;

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
        paddingBottom: 40,
    },
    controlsRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 30,
        marginBottom: 40,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    controlButtonActive: {
        backgroundColor: "#ffffff",
    },
    endCallContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    endButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#FF3B30", // Apple red/FB red
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
});
