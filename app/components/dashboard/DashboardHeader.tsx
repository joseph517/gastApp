import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS } from "../../constants/colors";

interface DashboardHeaderProps {
  onImportTestData: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onImportTestData }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>¡Hola! 👋</Text>
        <Text style={styles.subtitle}>Controla tus gastos</Text>
      </View>
      <TouchableOpacity style={styles.testDataButton} onPress={onImportTestData}>
        <Ionicons name="download-outline" size={16} color={colors.primary} />
        <Text style={styles.testDataButtonText}>Test Data</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.lg,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    greeting: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginTop: 4,
    },
    testDataButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      backgroundColor: colors.primary + "15",
      borderRadius: BORDER_RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    testDataButtonText: {
      fontSize: FONT_SIZES.xs,
      color: colors.primary,
      fontWeight: "600",
      marginLeft: 4,
    },
  });

export default DashboardHeader;