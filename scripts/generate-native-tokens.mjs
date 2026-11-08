#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const tokensDir = resolve(rootDir, "design-system/tokens");

const tokensJsonPath = resolve(tokensDir, "tokens.json");
const rawJson = readFileSync(tokensJsonPath, "utf-8");
const tokensData = JSON.parse(rawJson);

const light = tokensData.color.light;
const dark = tokensData.color.dark;

function cleanHex(hex) {
  return hex.replace("#", "").toUpperCase();
}

function hexToCompose(hex) {
  return `0xFF${cleanHex(hex)}`;
}

// 1. GENERATE Tokens.kt
const kotlinContent = `// Ruum Ruum — Design Tokens v1.0 (Kotlin)
// GENERADO AUTOMÁTICAMENTE desde design-system/tokens/tokens.json — NO EDITAR A MANO
// package: com.ruum.designsystem
package com.ruum.designsystem

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object RuumTokens {
    val Navy = Color(${hexToCompose(light.navy)})
    val Teal = Color(${hexToCompose(light.teal)})
    val TealDeep = Color(${hexToCompose(light["teal-deep"])})
    val Action = Color(${hexToCompose(light.action)})
    val Surface = Color(${hexToCompose(light.bg)})
    val White = Color(${hexToCompose(light.surface)})
    val Muted = Color(${hexToCompose(light["text-secondary"])})
    val BorderInput = Color(${hexToCompose(light["border-input"])})
    val Border = Color(${hexToCompose(light.border)})
    val Warning = Color(${hexToCompose(light.warning)})
    val WarningBg = Color(${hexToCompose(light["warning-bg"])})
    val WarningText = Color(${hexToCompose(light["warning-text"])})
    val Success = Color(${hexToCompose(light.success)})
    val SuccessBg = Color(${hexToCompose(light["success-bg"])})
    val SuccessText = Color(${hexToCompose(light["success-text"])})
    val Error = Color(${hexToCompose(light.error)})
    val ErrorBg = Color(${hexToCompose(light["error-bg"])})
    val Emergency = Color(${hexToCompose(light.emergency)})
    val NeutralBg = Color(${hexToCompose(light["neutral-bg"])})
    val ActionBg = Color(${hexToCompose(light["action-bg"])})

    val Touch = ${tokensData.size.touch}.dp
    val TouchStreet = ${tokensData.size["touch-street"]}.dp
    val ButtonHeight = 52.dp
    val ButtonHeightStreet = 56.dp
    val InputHeight = 48.dp

    val RadiusSm = ${tokensData.radius.sm}.dp
    val RadiusMd = ${tokensData.radius.md}.dp
    val RadiusLg = ${tokensData.radius.lg}.dp
    val RadiusXl = ${tokensData.radius.xl}.dp

    val Display = ${tokensData.typography.fontSize.display}.sp
    val H1 = ${tokensData.typography.fontSize.h1}.sp
    val H2 = ${tokensData.typography.fontSize.h2}.sp
    val H3 = ${tokensData.typography.fontSize.h3}.sp
    val Body = ${tokensData.typography.fontSize.body}.sp
    val Small = ${tokensData.typography.fontSize.small}.sp
    val Caption = ${tokensData.typography.fontSize.caption}.sp

    // Dark Mode v1.0 (§2)
    val DarkBg = Color(${hexToCompose(dark.bg)})
    val DarkSurface = Color(${hexToCompose(dark.surface)})
    val DarkSurfaceElevated = Color(${hexToCompose(dark["surface-elevated"])})
    val DarkBorder = Color(${hexToCompose(dark.border)})
    val DarkBorderInput = Color(${hexToCompose(dark["border-input"])})
    val DarkTextPrimary = Color(${hexToCompose(dark["text-primary"])})
    val DarkTextSecondary = Color(${hexToCompose(dark["text-secondary"])})
    val DarkTextMuted = Color(${hexToCompose(dark["text-muted"])})
    val DarkTeal = Color(${hexToCompose(dark.teal)})
    val DarkTealDeep = Color(${hexToCompose(dark["teal-deep"])})
    val DarkAction = Color(${hexToCompose(dark.action)})
    val DarkActionHover = Color(${hexToCompose(dark["action-hover"])})
    val DarkActionBg = Color(${hexToCompose(dark["action-bg-state"])})
    val DarkActionText = Color(${hexToCompose(dark["action-text-state"])})
    val DarkNeutralBg = Color(${hexToCompose(dark["neutral-bg"])})
    val DarkNeutralText = Color(${hexToCompose(dark["neutral-text"])})
    val DarkWarning = Color(${hexToCompose(dark["warning-text"])})
    val DarkWarningBg = Color(${hexToCompose(dark["warning-bg"])})
    val DarkWarningText = Color(${hexToCompose(dark["warning-text"])})
    val DarkSuccess = Color(${hexToCompose(dark["success-text"])})
    val DarkSuccessBg = Color(${hexToCompose(dark["success-bg"])})
    val DarkSuccessText = Color(${hexToCompose(dark["success-text"])})
    val DarkError = Color(${hexToCompose(dark["error-text"])})
    val DarkErrorBg = Color(${hexToCompose(dark["error-bg"])})
    val DarkErrorText = Color(${hexToCompose(dark["error-text"])})
    val DarkIncident = Color(${hexToCompose(dark["incident-text"])})
    val DarkIncidentBg = Color(${hexToCompose(dark["incident-bg"])})
    val DarkIncidentText = Color(${hexToCompose(dark["incident-text"])})
    val DarkEmergency = Color(${hexToCompose(dark.emergency)})
    val DarkEmergencyBg = Color(${hexToCompose(dark["emergency-bg"])})
    val DarkEmergencyText = Color(${hexToCompose(dark.emergency)})
    // Logotipo (cap. 10–12): RR blanco sobre navy en oscuro.
    val DarkLogoRR = Color(0xFFFFFFFF)
    val DarkLogoBg = Color(${hexToCompose(dark.navy)})
}
`;

// 2. GENERATE Tokens.swift
const swiftContent = `// Ruum Ruum — Design Tokens v1.0 (Swift)
// GENERADO AUTOMÁTICAMENTE desde design-system/tokens/tokens.json — NO EDITAR A MANO
// Uso: Text("Hola").font(.ruumBody).foregroundColor(.ruumNavy)
import SwiftUI

public extension Color {
    static let ruumNavy = Color(hex: "${cleanHex(light.navy)}")
    static let ruumTeal = Color(hex: "${cleanHex(light.teal)}")
    static let ruumTealDeep = Color(hex: "${cleanHex(light["teal-deep"])}")
    static let ruumAction = Color(hex: "${cleanHex(light.action)}")
    static let ruumSurface = Color(hex: "${cleanHex(light.bg)}")
    static let ruumMuted = Color(hex: "${cleanHex(light["text-secondary"])}")
    static let ruumBorderInput = Color(hex: "${cleanHex(light["border-input"])}")
    static let ruumBorder = Color(hex: "${cleanHex(light.border)}")
    static let ruumWarning = Color(hex: "${cleanHex(light.warning)}")
    static let ruumWarningBg = Color(hex: "${cleanHex(light["warning-bg"])}")
    static let ruumWarningText = Color(hex: "${cleanHex(light["warning-text"])}")
    static let ruumSuccess = Color(hex: "${cleanHex(light.success)}")
    static let ruumSuccessBg = Color(hex: "${cleanHex(light["success-bg"])}")
    static let ruumSuccessText = Color(hex: "${cleanHex(light["success-text"])}")
    static let ruumError = Color(hex: "${cleanHex(light.error)}")
    static let ruumErrorBg = Color(hex: "${cleanHex(light["error-bg"])}")
    static let ruumEmergency = Color(hex: "${cleanHex(light.emergency)}")
    static let ruumNeutralBg = Color(hex: "${cleanHex(light["neutral-bg"])}")
    static let ruumActionBg = Color(hex: "${cleanHex(light["action-bg"])}")

    init(hex: String) {
        var h = hex.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: "#", with: "")
        if h.count == 6 { h += "FF" }
        var v: UInt64 = 0
        Scanner(string: h).scanHexInt64(&v)
        self.init(
            .sRGB,
            red: Double((v & 0xFF000000) >> 24) / 255,
            green: Double((v & 0x00FF0000) >> 16) / 255,
            blue: Double((v & 0x0000FF00) >> 8) / 255,
            opacity: Double(v & 0x000000FF) / 255
        )
    }
}

public enum RuumTokens {
    public static let touch: CGFloat = ${tokensData.size.touch}
    public static let touchStreet: CGFloat = ${tokensData.size["touch-street"]}
    public static let buttonHeight: CGFloat = 52
    public static let buttonHeightStreet: CGFloat = 56
    public static let inputHeight: CGFloat = 48
    public static let radiusSM: CGFloat = ${tokensData.radius.sm}
    public static let radiusMD: CGFloat = ${tokensData.radius.md}
    public static let radiusLG: CGFloat = ${tokensData.radius.lg}
    public static let radiusXL: CGFloat = ${tokensData.radius.xl}
}

// MARK: - Dark Mode v1.0 (§2)
public extension Color {
    static let ruumDarkBg = Color(hex: "${cleanHex(dark.bg)}")
    static let ruumDarkSurface = Color(hex: "${cleanHex(dark.surface)}")
    static let ruumDarkSurfaceElevated = Color(hex: "${cleanHex(dark["surface-elevated"])}")
    static let ruumDarkBorder = Color(hex: "${cleanHex(dark.border)}")
    static let ruumDarkBorderInput = Color(hex: "${cleanHex(dark["border-input"])}")
    static let ruumDarkTextPrimary = Color(hex: "${cleanHex(dark["text-primary"])}")
    static let ruumDarkTextSecondary = Color(hex: "${cleanHex(dark["text-secondary"])}")
    static let ruumDarkTextMuted = Color(hex: "${cleanHex(dark["text-muted"])}")
    static let ruumDarkTeal = Color(hex: "${cleanHex(dark.teal)}")
    static let ruumDarkTealDeep = Color(hex: "${cleanHex(dark["teal-deep"])}")
    static let ruumDarkAction = Color(hex: "${cleanHex(dark.action)}")
    static let ruumDarkActionHover = Color(hex: "${cleanHex(dark["action-hover"])}")
    static let ruumDarkActionBg = Color(hex: "${cleanHex(dark["action-bg-state"])}")
    static let ruumDarkActionText = Color(hex: "${cleanHex(dark["action-text-state"])}")
    static let ruumDarkNeutralBg = Color(hex: "${cleanHex(dark["neutral-bg"])}")
    static let ruumDarkNeutralText = Color(hex: "${cleanHex(dark["neutral-text"])}")
    static let ruumDarkWarning = Color(hex: "${cleanHex(dark["warning-text"])}")
    static let ruumDarkWarningBg = Color(hex: "${cleanHex(dark["warning-bg"])}")
    static let ruumDarkWarningText = Color(hex: "${cleanHex(dark["warning-text"])}")
    static let ruumDarkSuccess = Color(hex: "${cleanHex(dark["success-text"])}")
    static let ruumDarkSuccessBg = Color(hex: "${cleanHex(dark["success-bg"])}")
    static let ruumDarkSuccessText = Color(hex: "${cleanHex(dark["success-text"])}")
    static let ruumDarkError = Color(hex: "${cleanHex(dark["error-text"])}")
    static let ruumDarkErrorBg = Color(hex: "${cleanHex(dark["error-bg"])}")
    static let ruumDarkErrorText = Color(hex: "${cleanHex(dark["error-text"])}")
    static let ruumDarkIncident = Color(hex: "${cleanHex(dark["incident-text"])}")
    static let ruumDarkIncidentBg = Color(hex: "${cleanHex(dark["incident-bg"])}")
    static let ruumDarkIncidentText = Color(hex: "${cleanHex(dark["incident-text"])}")
    static let ruumDarkEmergency = Color(hex: "${cleanHex(dark.emergency)}")
    static let ruumDarkEmergencyBg = Color(hex: "${cleanHex(dark["emergency-bg"])}")
    static let ruumDarkEmergencyText = Color(hex: "${cleanHex(dark.emergency)}")
    // Logotipo (cap. 10–12): RR blanco sobre navy en oscuro; swoosh/pin teal sin cambios.
    static let ruumDarkLogoRR = Color(hex: "FFFFFF")
    static let ruumDarkLogoBg = Color(hex: "${cleanHex(dark.navy)}")
}
`;

// 3. GENERATE tokens.ts
const tsContent = `/**
 * Ruum Ruum — Design Tokens v1.0 para React Native / TypeScript
 * GENERADO AUTOMÁTICAMENTE desde design-system/tokens/tokens.json — NO EDITAR A MANO
 * Uso: import { tokens } from "./tokens"; StyleSheet.create({ btn: { height: tokens.size.buttonHeight } })
 */

export const tokens = {
  color: {
    navy: "${light.navy}",
    teal: "${light.teal}",
    tealDeep: "${light["teal-deep"]}",
    blue: "${light.action}",
    action: "${light.action}",
    surface: "${light.bg}",
    white: "${light.surface}",
    muted: "${light["text-secondary"]}",
    borderInput: "${light["border-input"]}",
    border: "${light.border}",
    warning: "${light.warning}",
    success: "${light.success}",
    error: "${light.error}",
    emergency: "${light.emergency}",
    neutralBg: "${light["neutral-bg"]}",
    actionBg: "${light["action-bg"]}",
    actionText: "#1461E0",
    warningBg: "${light["warning-bg"]}",
    warningText: "${light["warning-text"]}",
    successBg: "${light["success-bg"]}",
    successText: "${light["success-text"]}",
    errorBg: "${light["error-bg"]}",
    errorText: "${light.error}",
  },
  gradient: {
    cta: ["${light["teal-deep"]}", "${light.action}"] as const,
    route: ["${light.teal}", "${light.action}"] as const,
  },
  font: {
    family: "Inter",
    fallback: ["Arial", "Calibri", "sans-serif"] as const,
    size: {
      display: ${tokensData.typography.fontSize.display},
      h1: ${tokensData.typography.fontSize.h1},
      h2: ${tokensData.typography.fontSize.h2},
      h3: ${tokensData.typography.fontSize.h3},
      body: ${tokensData.typography.fontSize.body},
      small: ${tokensData.typography.fontSize.small},
      caption: ${tokensData.typography.fontSize.caption},
      streetBody: 17,
    },
    weight: {
      regular: "${tokensData.typography.fontWeight.regular}",
      medium: "${tokensData.typography.fontWeight.medium}",
      semibold: "${tokensData.typography.fontWeight.semibold}",
      bold: "${tokensData.typography.fontWeight.bold}",
      extrabold: "${tokensData.typography.fontWeight.extrabold}",
    } as const,
  },
  space: { s4: 4, s8: 8, s12: 12, s16: 16, s20: 20, s24: 24, s32: 32, s40: 40, s48: 48 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 999, button: 14, field: 12, card: 20, modal: 20 },
  elevation: {
    e1: { shadowColor: "#0D2B5E", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
    e2: { shadowColor: "#0D2B5E", shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  },
  size: { touch: ${tokensData.size.touch}, touchStreet: ${tokensData.size["touch-street"]}, buttonHeight: 52, buttonHeightStreet: 56, inputHeight: 48 },
  motion: { micro: 150, transition: 250, easing: "ease-out" as const },
  dark: {
    color: {
      bg: "${dark.bg}",
      surface: "${dark.surface}",
      surfaceElevated: "${dark["surface-elevated"]}",
      border: "${dark.border}",
      borderInput: "${dark["border-input"]}",
      textPrimary: "${dark["text-primary"]}",
      textSecondary: "${dark["text-secondary"]}",
      textMuted: "${dark["text-muted"]}",
      navy: "${dark.navy}",
      teal: "${dark.teal}",
      tealDeep: "${dark["teal-deep"]}",
      action: "${dark.action}",
      actionHover: "${dark["action-hover"]}",
      warning: "${dark["warning-text"]}",
      warningBg: "${dark["warning-bg"]}",
      warningText: "${dark["warning-text"]}",
      success: "${dark["success-text"]}",
      successBg: "${dark["success-bg"]}",
      successText: "${dark["success-text"]}",
      error: "${dark["error-text"]}",
      errorBg: "${dark["error-bg"]}",
      errorText: "${dark["error-text"]}",
      incident: "${dark["incident-text"]}",
      incidentBg: "${dark["incident-bg"]}",
      incidentText: "${dark["incident-text"]}",
      emergency: "${dark.emergency}",
      emergencyBg: "${dark["emergency-bg"]}",
      emergencyText: "${dark.emergency}",
      neutralText: "${dark["neutral-text"]}",
      neutralBg: "${dark["neutral-bg"]}",
      actionText: "${dark["action-text-state"]}",
      actionBg: "${dark["action-bg-state"]}",
    },
    gradient: {
      cta: ["${dark["teal-deep"]}", "${dark.action}"] as const,
      route: ["${dark.teal}", "${dark.action}"] as const,
    },
  },
} as const;

export type Tokens = typeof tokens;
`;

writeFileSync(resolve(tokensDir, "Tokens.kt"), kotlinContent, "utf-8");
writeFileSync(resolve(tokensDir, "Tokens.swift"), swiftContent, "utf-8");
writeFileSync(resolve(tokensDir, "tokens.ts"), tsContent, "utf-8");

console.log("Tokens nativos generados exitosamente desde tokens.json:");
console.log("- design-system/tokens/Tokens.kt");
console.log("- design-system/tokens/Tokens.swift");
console.log("- design-system/tokens/tokens.ts");
