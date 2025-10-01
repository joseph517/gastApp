import React from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from "../../constants/colors";

interface CategoryLimitItemProps {
  category: string;
  limit: number;
  onLimitChange: (category: string, limit: number) => void;
  onClear: (category: string) => void;
}

const CategoryLimitItem: React.FC<CategoryLimitItemProps> = ({
  category,
  limit,
  onLimitChange,
  onClear,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const formatInput = (value: string): string => {
    const numericValue = value.replace(/[^0-9]/g, "");
    if (!numericValue) return "";
    return new Intl.NumberFormat("es-CO").format(parseInt(numericValue));
  };

  const handleChange = (text: string) => {
    const numericValue = parseInt(text.replace(/[^0-9]/g, "")) || 0;
    onLimitChange(category, numericValue);
  };

  const handleClear = () => {
    onClear(category);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.categoryName}>{category}</Text>
        <Text style={styles.description}>Límite mensual opcional</Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.input}
            value={formatInput(limit.toString())}
            onChangeText={handleChange}
            placeholder="Sin límite"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        {limit > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.sm,
    },
    content: {
      flex: 1,
      marginRight: SPACING.md,
    },
    categoryName: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 2,
    },
    description: {
      fontSize: FONT_SIZES.xs,
      color: colors.textSecondary,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: BORDER_RADIUS.sm,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
    },
    currencySymbol: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      color: colors.textSecondary,
      marginRight: 4,
    },
    input: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      color: colors.textPrimary,
      minWidth: 80,
      textAlign: "right",
    },
    clearButton: {
      padding: SPACING.xs,
    },
  });

export default CategoryLimitItem;
