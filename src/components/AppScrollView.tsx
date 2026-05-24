
import { RefreshControl, ScrollView } from "react-native";
import { useRefresh } from "../contexts/RefreshContext";
import React from "react";
import { Colors } from "../utils/theme";

export const AppScrollView = ({ children }: { children: React.ReactNode }) => {
    const { refreshing, triggerRefresh } = useRefresh();

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={triggerRefresh}
                    tintColor="#007aff"          // iOS spinner
                    colors={[Colors.primary]}         // Android spinner
                    progressBackgroundColor="#fff"
                    progressViewOffset={12}
                />
            }
        >
            {children}
        </ScrollView>
    );
};
