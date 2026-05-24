import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OutgoingCallScreen from "../screens/call_screens/OutgoingCallScreen";
import IncomingCallScreen from "../screens/call_screens/IncomingCallScreen";
import InCallScreen from "../screens/call_screens/InCallScreen";
import { CallStackParamList } from "./types";

const CallStack = createNativeStackNavigator<CallStackParamList>();

export function CallStackScreen() {
  return (
    <CallStack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: "modal",
      }}
    >
      <CallStack.Screen name="OutgoingCall" component={OutgoingCallScreen} />
      <CallStack.Screen name="IncomingCall" component={IncomingCallScreen} />
      <CallStack.Screen name="InCall" component={InCallScreen} />
    </CallStack.Navigator>
  );
}
