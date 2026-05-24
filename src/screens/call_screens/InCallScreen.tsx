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
    Animated,
    PanResponder,
    Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChannelProfileType, ClientRoleType, createAgoraRtcEngine, IRtcEngine, RtcSurfaceView, RtcTextureView, RenderModeType, VideoMirrorModeType, VideoCodecType, OrientationMode, DegradationPreference, VideoContentHint } from "react-native-agora";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Colors } from "../../utils/theme";
import { endCall, listenCall, updateDurationCall } from "../../services/callService";
import { AGORA_APP_ID } from "../../configs/config";
import { CallStackParamList } from "../../navigation/types";
import { fetchAgoraToken } from "../../services/agoraService";
import { createExitToChat } from "../../navigation/ChatNavigation";
import { useUser } from "../../contexts/UserContext";


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Sub-component for Timer to prevent full screen re-renders
const CallTimer = React.memo(({ startTime }: { startTime: number }) => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            const elapsedMs = Date.now() - startTime;
            setSeconds(Math.floor(elapsedMs / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [startTime]);

    const formatTime = (s: number): string => {
        const minutes = Math.floor(s / 60).toString().padStart(2, "0");
        const seconds = (s % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
    };
    return <Text style={styles.timeText}>{formatTime(seconds)}</Text>;
});

type Props = NativeStackScreenProps<CallStackParamList, "InCall">;
export const InCallScreen = ({ route, navigation }: Props) => {
    const { callId, partnerUser, conversationId, callType } = route.params;
    const engineRef = useRef<IRtcEngine | null>(null);
    const [muted, setMuted] = useState(false);
    const [speakerOn, setSpeakerOn] = useState(callType === 'video'); // Default speaker on for video
    const [videoOn, setVideoOn] = useState(callType === 'video');
    const [isEngineReady, setIsEngineReady] = useState(false);
    const [remoteUid, setRemoteUid] = useState<number | null>(null);
    const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    // Draggable position for local video using Native Driver
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 100 })).current;

    // Internal values to track position for offset management without re-rendering
    const _val = useRef({ x: 0, y: 100 });
    useEffect(() => {
        const id = pan.addListener((value) => _val.current = value);
        return () => pan.removeListener(id);
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: _val.current.x,
                    y: _val.current.y
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();
            }
        })
    ).current;

    // Giới hạn vùng di chuyển bằng Interpolation
    const minX = -(SCREEN_WIDTH - 120 - 40);
    const maxX = 0;
    const minY = -40;
    const maxY = SCREEN_HEIGHT - 180 - 200;

    const boundedTranslateX = pan.x.interpolate({
        inputRange: [minX, maxX],
        outputRange: [minX, maxX],
        extrapolate: 'clamp',
    });

    const boundedTranslateY = pan.y.interpolate({
        inputRange: [minY, maxY],
        outputRange: [minY, maxY],
        extrapolate: 'clamp',
    });




    // init Agora
    const joinedRef = useRef(false);
    useEffect(() => {
        if (joinedRef.current) return;

        joinedRef.current = true;

        const initAgora = async () => {
            const engine = createAgoraRtcEngine();
            engineRef.current = engine;

            engine.initialize({ appId: AGORA_APP_ID });

            if (callType === 'video') {
                engine.enableVideo();

                // 📉 Hạ cấu hình video để tăng hiệu suất kéo thả
                engine.setVideoEncoderConfiguration({
                    codecType: VideoCodecType.VideoCodecH264,
                    dimensions: { width: 480, height: 640 },
                    frameRate: 15, // Giảm FPS để giảm tải CPU
                    bitrate: 800,
                    orientationMode: OrientationMode.OrientationModeFixedPortrait,
                    degradationPreference: DegradationPreference.MaintainQuality,
                });

                engine.enableLocalVideo(true);
                engine.muteLocalVideoStream(false); // Đảm bảo không bị mute ngay từ đầu
            } else {
                engine.enableAudio();
            }
            // Thêm delay để camera kịp khởi động hoàn toàn
            setTimeout(async () => {
                await engine.startPreview();
                initTimeoutRef.current = setTimeout(() => {
                    setIsEngineReady(true);
                }, 1000);
            }, 500);

            engine.enableLocalAudio(true);
            engine.muteLocalAudioStream(false);
            engine.muteAllRemoteAudioStreams(false);
            engine.setEnableSpeakerphone(callType === 'video');

            // ✅ ĐÚNG CÁCH REGISTER EVENT
            engine.registerEventHandler({
                onJoinChannelSuccess: (connection) => {
                    // console.log("✅ Local joined channel:", connection.channelId);
                },

                onUserJoined: (connection, remoteUid) => {
                    setRemoteUid(remoteUid);
                },

                onUserOffline: (connection, remoteUid) => {
                    setRemoteUid(null);
                },
            });

            const uid = Math.floor(Math.random() * 100000);

            const tokenRes = await fetchAgoraToken(callId, uid);

            if (!tokenRes) {
                console.log("❌ Failed to fetch Agora token");
                return;
            }
            engine.joinChannel(
                tokenRes.token,
                callId,
                uid,
                {
                    channelProfile: ChannelProfileType.ChannelProfileCommunication,
                    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                    publishMicrophoneTrack: true,
                    publishCameraTrack: callType === 'video',
                    autoSubscribeAudio: true,
                    autoSubscribeVideo: callType === 'video',
                }
            );
        };

        initAgora();

        return () => {
            cleanupCall();
        };
    }, [callId]);


    const { user: currentUser } = useUser();
    // listen Firestore end
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
        const unsub = listenCall(callId, async (call) => {
            if (call?.status === "ended") {
                await cleanupCall();
                exitToChat?.();
            }
        });
        return unsub;
    }, [callId, conversationId, partnerUser]);

    const handleEndCall = async () => {
        await cleanupCall();
        await endCall(callId);
        if (conversationId) {
            const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
            await updateDurationCall(conversationId, callId, finalDuration);
        }
    };

    const toggleMute = async () => {
        if (!engineRef.current) return;
        await engineRef.current.muteLocalAudioStream(!muted);
        setMuted(!muted);
    };

    const toggleSpeaker = async () => {
        if (!engineRef.current) return;
        await engineRef.current.setEnableSpeakerphone(!speakerOn);
        setSpeakerOn(!speakerOn);
    };

    const toggleVideo = async () => {
        if (!engineRef.current || callType !== 'video') return;
        const newState = !videoOn;
        await engineRef.current.muteLocalVideoStream(!newState);
        setVideoOn(newState);
    };

    const switchCamera = async () => {
        if (!engineRef.current || callType !== 'video') return;
        await engineRef.current.switchCamera();
    };

    const cleanupCall = async () => {
        setIsEngineReady(false);
        if (!engineRef.current) return;
        try {
            // 1. Hủy đăng ký các sự kiện trước
            engineRef.current.unregisterEventHandler({});

            // 2. Dừng các luồng dữ liệu
            await engineRef.current.stopPreview();
            await engineRef.current.muteLocalAudioStream(true);
            await engineRef.current.muteLocalVideoStream(true);
            await engineRef.current.disableVideo(); // 🚀 Tắt hẳn engine video

            // 3. Rời kênh và giải phóng Engine
            await engineRef.current.leaveChannel();
            engineRef.current.release();
            engineRef.current = null;

            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
            }

            // 4. Gỡ bỏ listener của Animated
            pan.removeAllListeners();
        } catch (e) {
            console.warn("cleanupCall error", e);
            engineRef.current = null;
        }
    };


    return (
        <View style={styles.background}>
            {callType === 'video' ? (
                <View style={styles.videoContainer}>
                    {/* Remote Video (Full Screen) */}
                    {remoteUid ? (
                        <RtcSurfaceView
                            canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }}
                            style={styles.remoteVideo}
                        />
                    ) : (
                        <ImageBackground
                            source={{ uri: partnerUser.avatar }}
                            style={styles.remoteVideoPlaceholder}
                        >
                            <View style={styles.blurOverlay} />
                            <View style={styles.remoteAvatarWrap}>
                                <Image source={{ uri: partnerUser.avatar }} style={styles.largeAvatar} />
                                <Text style={styles.callingText}>Đang chờ kết nối...</Text>
                            </View>
                        </ImageBackground>
                    )}

                    {/* Local Video (Small Overlay) - Draggable */}
                    {isEngineReady && videoOn && (
                        <Animated.View
                            {...panResponder.panHandlers}
                            style={[
                                styles.localVideoContainer,
                                {
                                    transform: [
                                        { translateX: boundedTranslateX },
                                        { translateY: boundedTranslateY }
                                    ]
                                }
                            ]}
                        >
                            <RtcTextureView
                                canvas={{
                                    uid: 0,
                                    renderMode: RenderModeType.RenderModeHidden,
                                    mirrorMode: VideoMirrorModeType.VideoMirrorModeEnabled
                                }}
                                style={styles.localVideo}
                            />
                        </Animated.View>
                    )}

                    <View style={styles.videoOverlay}>
                        <SafeAreaView style={styles.container}>
                            <View style={styles.videoTopSection}>
                                <Text style={styles.videoName}>{partnerUser.name}</Text>
                                <CallTimer startTime={startTimeRef.current} />
                            </View>

                            <View style={styles.bottomSection}>
                                <View style={styles.controlsRow}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={styles.controlButton}
                                        onPress={switchCamera}
                                    >
                                        <Ionicons name="camera-reverse" size={28} color="#fff" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={[styles.controlButton, !videoOn && styles.controlButtonActive]}
                                        onPress={toggleVideo}
                                    >
                                        <Ionicons
                                            name={videoOn ? "videocam" : "videocam-off"}
                                            size={28}
                                            color={videoOn ? "#fff" : "#000"}
                                        />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={[styles.controlButton, muted && styles.controlButtonActive]}
                                        onPress={toggleMute}
                                    >
                                        <Ionicons
                                            name={muted ? "mic-off" : "mic"}
                                            size={28}
                                            color={muted ? "#000" : "#fff"}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.endCallContainer}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={styles.endButton}
                                        onPress={handleEndCall}
                                    >
                                        <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </SafeAreaView>
                    </View>
                </View>
            ) : (
                <ImageBackground
                    source={{ uri: partnerUser.avatar }}
                    style={styles.background}
                >
                    <View style={styles.blurOverlay} />
                    <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                    <View style={styles.overlay}>
                        <SafeAreaView style={styles.container}>
                            <View style={styles.topSection}>
                                <View style={styles.avatarContainer}>
                                    <Image source={{ uri: partnerUser.avatar }} style={styles.avatar} />
                                    <View style={styles.activeGlow} />
                                </View>
                                <Text style={styles.name}>{partnerUser.name}</Text>
                                <CallTimer startTime={startTimeRef.current} />
                            </View>

                            <View style={styles.bottomSection}>
                                <View style={styles.controlsRow}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={[styles.controlButton, speakerOn && styles.controlButtonActive]}
                                        onPress={toggleSpeaker}
                                    >
                                        <Ionicons
                                            name={speakerOn ? "volume-high" : "volume-medium"}
                                            size={28}
                                            color={speakerOn ? "#000" : "#fff"}
                                        />
                                    </TouchableOpacity>

                                    <View style={styles.controlButtonDisabled}>
                                        <Ionicons name="videocam-off" size={28} color="rgba(255,255,255,0.3)" />
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={[styles.controlButton, muted && styles.controlButtonActive]}
                                        onPress={toggleMute}
                                    >
                                        <Ionicons
                                            name={muted ? "mic-off" : "mic"}
                                            size={28}
                                            color={muted ? "#000" : "#fff"}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.endCallContainer}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={styles.endButton}
                                        onPress={handleEndCall}
                                    >
                                        <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </SafeAreaView>
                    </View>
                </ImageBackground>
            )}
        </View>
    );
};

export default InCallScreen;


const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#1a1a1a",
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.65)", // Darker overlay for active call
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
        marginBottom: 24,
        width: 140,
        height: 140,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        zIndex: 10,
    },
    activeGlow: {
        position: "absolute",
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    name: {
        fontSize: 28,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    time: {
        fontSize: 18,
        color: "rgba(255, 255, 255, 0.8)",
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
        backgroundColor: "#FF3B30",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    controlButtonDisabled: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        alignItems: "center",
        justifyContent: "center",
    },
    // Video Call Styles
    videoContainer: {
        flex: 1,
        backgroundColor: "#000",
    },
    remoteVideo: {
        flex: 1,
    },
    remoteVideoPlaceholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    remoteAvatarWrap: {
        alignItems: "center",
    },
    largeAvatar: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 4,
        borderColor: "rgba(255,255,255,0.2)",
    },
    callingText: {
        color: "#fff",
        fontSize: 18,
        marginTop: 20,
        fontWeight: "600",
    },
    localVideoContainer: {
        position: "absolute",
        top: 60,
        right: 20,
        width: 120,
        height: 180,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.5)",
        zIndex: 100,
        backgroundColor: "#000",
    },
    localVideo: {
        flex: 1,
    },
    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.6)", // Hiệu ứng thay thế cho blurRadius
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 50,
    },
    videoTopSection: {
        marginTop: 60,
        alignItems: "center",
        zIndex: 60,
    },
    videoName: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "700",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    videoTime: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 16,
        marginTop: 4,
    },
    timeText: {
        fontSize: 18,
        color: "rgba(255, 255, 255, 0.8)",
        fontWeight: "500",
        marginTop: 4,
    },
});
