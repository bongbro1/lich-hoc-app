import React from 'react';
import { View, Text } from 'react-native';

// Mock components to prevent Expo Go from crashing on Native Agora components
export const RtcSurfaceView = ({ style, children }: any) => (
  <View style={[style, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
    {children || <Text style={{ color: '#666' }}>[Video Call Native Only]</Text>}
  </View>
);

export const RtcTextureView = ({ style, children }: any) => (
  <View style={[style, { backgroundColor: '#444', justifyContent: 'center', alignItems: 'center' }]}>
    {children || <Text style={{ color: '#666' }}>[Local Preview]</Text>}
  </View>
);

// Mock Engine Creator
export const createAgoraRtcEngine = () => {
  console.warn('Agora Native Engine is not available in Expo Go. Call features will be disabled.');
  return {
    initialize: () => {},
    enableVideo: () => {},
    enableAudio: () => {},
    setVideoEncoderConfiguration: () => {},
    enableLocalVideo: () => {},
    muteLocalVideoStream: () => {},
    startPreview: async () => {},
    enableLocalAudio: () => {},
    muteLocalAudioStream: () => {},
    muteAllRemoteAudioStreams: () => {},
    setEnableSpeakerphone: () => {},
    registerEventHandler: () => {},
    joinChannel: () => {},
    switchCamera: () => {},
    stopPreview: async () => {},
    leaveChannel: async () => {},
    release: () => {},
    unregisterEventHandler: () => {},
    disableVideo: () => {},
  };
};

// Mock Enums and constants
export const ChannelProfileType = { ChannelProfileCommunication: 1 };
export const ClientRoleType = { ClientRoleBroadcaster: 1 };
export const RenderModeType = { RenderModeHidden: 1 };
export const VideoMirrorModeType = { VideoMirrorModeEnabled: 1 };
export const VideoCodecType = { VideoCodecH264: 1 };
export const OrientationMode = { OrientationModeFixedPortrait: 1 };
export const DegradationPreference = { DegradationPreferenceMaintainQuality: 1 };
export const VideoContentHint = { None: 0 };
