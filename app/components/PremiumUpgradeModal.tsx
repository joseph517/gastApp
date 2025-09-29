import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../constants/colors";
import { useToast } from "app/contexts/ToastContext";
import ToastContainer from "./shared/ToastContainer";

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgradeSuccess: () => void;
}

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  visible,
  onClose,
  onUpgradeSuccess,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const { showToast } = useToast();

  const handleUpgrade = () => {
    // if (
    //   !formData.fullName ||
    //   !formData.email ||
    //   !formData.cardNumber ||
    //   !formData.expiryDate ||
    //   !formData.cvv
    // ) {
    //   showToast("Por favor, completa todos los campos.", "error", {
    //     duration: 3000,
    //   });
    //   return;
    // }

    // Limpiar formulario y activar premium
    setFormData({
      fullName: "",
      email: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    });
    onUpgradeSuccess();

    // Mostrar toast de éxito y cerrar modal
    showToast("¡Upgrade Exitoso!", "success", {
      duration: 2000,
    });

    onClose();
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted.slice(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade a Premium</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.premiumBanner}>
            <Text style={styles.bannerIcon}>💎</Text>
            <Text style={styles.bannerTitle}>GastApp Premium</Text>
            <Text style={styles.bannerSubtitle}>
              Desbloquea todas las funciones avanzadas
            </Text>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>¿Qué incluye Premium?</Text>

            {[
              "Gastos ilimitados",
              "Análisis avanzado con gráficos",
              "Exportar datos a Excel y PDF",
              "Control de presupuesto",
              "Reportes personalizados",
              "Gastos recurrentes automáticos",
              "Soporte multi-moneda",
              "Sincronización en la nube",
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pricingSection}>
            <View style={styles.priceCard}>
              <Text style={styles.priceAmount}>$1.99</Text>
              <Text style={styles.priceLabel}>/ mes</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información de Pago</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData({ ...formData, fullName: text })
                }
                placeholder="Juan Pérez"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                placeholder="juan@ejemplo.com"
                keyboardType="email-address"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Número de Tarjeta</Text>
              <TextInput
                style={styles.input}
                value={formData.cardNumber}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    cardNumber: formatCardNumber(text),
                  })
                }
                placeholder="1234 5678 9012 3456"
                keyboardType="numeric"
                maxLength={19}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputRow}>
              <View
                style={[
                  styles.inputGroup,
                  { flex: 1, marginRight: SPACING.sm },
                ]}
              >
                <Text style={styles.inputLabel}>Fecha Venc.</Text>
                <TextInput
                  style={styles.input}
                  value={formData.expiryDate}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      expiryDate: formatExpiryDate(text),
                    })
                  }
                  placeholder="MM/AA"
                  keyboardType="numeric"
                  maxLength={5}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View
                style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}
              >
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  value={formData.cvv}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      cvv: text.replace(/\D/g, "").slice(0, 3),
                    })
                  }
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
          >
            <View style={styles.upgradeButtonContent}>
              <Text style={styles.upgradeButtonText}>Activar Premium</Text>
              <Text style={styles.upgradeButtonSubtext}>$9.99/mes</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Al continuar aceptas nuestros términos de servicio. Puedes cancelar
            en cualquier momento.
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>

        <ToastContainer />
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray200,
    },
    closeButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    content: {
      flex: 1,
    },
    premiumBanner: {
      alignItems: "center",
      paddingVertical: SPACING.xl,
      paddingHorizontal: SPACING.md,
    },
    bannerIcon: {
      fontSize: 64,
      marginBottom: SPACING.md,
    },
    bannerTitle: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    bannerSubtitle: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      textAlign: "center",
    },
    featuresSection: {
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.xl,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: SPACING.md,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    featureText: {
      fontSize: FONT_SIZES.md,
      color: colors.textPrimary,
      marginLeft: SPACING.sm,
    },
    pricingSection: {
      alignItems: "center",
      marginBottom: SPACING.xl,
    },
    priceCard: {
      flexDirection: "row",
      alignItems: "baseline",
      backgroundColor: colors.cardBackground,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      ...SHADOWS.small,
    },
    priceAmount: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.primary,
    },
    priceLabel: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    formSection: {
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.xl,
    },
    inputGroup: {
      marginBottom: SPACING.md,
    },
    inputRow: {
      flexDirection: "row",
    },
    inputLabel: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: SPACING.xs,
    },
    input: {
      backgroundColor: colors.cardBackground,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      fontSize: FONT_SIZES.md,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.gray200,
    },
    upgradeButton: {
      backgroundColor: colors.accent,
      marginHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      ...SHADOWS.medium,
    },
    upgradeButtonContent: {
      alignItems: "center",
      paddingVertical: SPACING.lg,
    },
    upgradeButtonText: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.background,
    },
    upgradeButtonSubtext: {
      fontSize: FONT_SIZES.sm,
      color: colors.background + "CC",
      marginTop: 2,
    },
    disclaimer: {
      fontSize: FONT_SIZES.xs,
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: SPACING.md,
      marginTop: SPACING.lg,
      lineHeight: 18,
    },
  });

export default PremiumUpgradeModal;
