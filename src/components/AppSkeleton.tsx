import React from "react";
import { View } from "react-native";
import Skeleton from "../types/Skeleton";

export default function AppSkeleton() {
  return (
    <View
      style={{
        padding: 16,
        backgroundColor: "#FFF",
        flex: 1
      }}
    >
      {/* Block 1 */}
      <Skeleton
        height={60}
        radius={14}
        style={{ marginBottom: 20 }}
      />

      {/* Block 2 */}
      <Skeleton
        height={120}
        radius={16}
        style={{ marginBottom: 20 }}
      />

      {/* Block 3 */}
      <Skeleton
        height={80}
        radius={16}
        style={{ marginBottom: 20 }}
      />

      {/* Block 4 */}
      <Skeleton height={48} radius={14} />
    </View>
  );
}
