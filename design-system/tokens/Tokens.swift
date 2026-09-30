// Ruum Ruum — Design Tokens v1.0 (Swift)
// Fuente: design-system/tokens/tokens.json
// Uso: Text("Hola").font(.ruumBody).foregroundColor(.ruumNavy)
import SwiftUI

public extension Color {
    static let ruumNavy = Color(hex: "0A2342")
    static let ruumTeal = Color(hex: "00D1D1")
    static let ruumTealDeep = Color(hex: "008B8B")
    static let ruumAction = Color(hex: "0066FF")
    static let ruumSurface = Color(hex: "E8EEF4")
    static let ruumMuted = Color(hex: "566889")
    static let ruumBorderInput = Color(hex: "7A8DAE")
    static let ruumBorder = Color(hex: "E6F0FF")
    static let ruumWarning = Color(hex: "F5B400")
    static let ruumWarningBg = Color(hex: "FFF4D6")
    static let ruumWarningText = Color(hex: "7A4F00")
    static let ruumSuccess = Color(hex: "16805A")
    static let ruumSuccessBg = Color(hex: "E6F6EE")
    static let ruumSuccessText = Color(hex: "0F6B48")
    static let ruumError = Color(hex: "C23648")
    static let ruumErrorBg = Color(hex: "FDECEF")
    static let ruumEmergency = Color(hex: "B3261E")
    static let ruumNeutralBg = Color(hex: "EEF2F8")
    static let ruumActionBg = Color(hex: "E8F0FE")

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
    public static let touch: CGFloat = 44
    public static let touchStreet: CGFloat = 56
    public static let buttonHeight: CGFloat = 52
    public static let buttonHeightStreet: CGFloat = 56
    public static let inputHeight: CGFloat = 48
    public static let radiusSM: CGFloat = 8
    public static let radiusMD: CGFloat = 12
    public static let radiusLG: CGFloat = 16
    public static let radiusXL: CGFloat = 24
}

// MARK: - Dark Mode v1.0 (§2)
public extension Color {
    static let ruumDarkBg = Color(hex: "061529")
    static let ruumDarkSurface = Color(hex: "0A2342")
    static let ruumDarkSurfaceElevated = Color(hex: "0F2D52")
    static let ruumDarkBorder = Color(hex: "1A3A5C")
    static let ruumDarkBorderInput = Color(hex: "2D4F73")
    static let ruumDarkTextPrimary = Color(hex: "F6F8FB")
    static let ruumDarkTextSecondary = Color(hex: "A8B5CC")
    static let ruumDarkTextMuted = Color(hex: "8293B0")
    static let ruumDarkTeal = Color(hex: "00D1D1")
    static let ruumDarkTealDeep = Color(hex: "00B3B3")
    static let ruumDarkAction = Color(hex: "4D94FF")
    static let ruumDarkActionHover = Color(hex: "6BA8FF")
    static let ruumDarkActionBg = Color(hex: "0F2D52")
    static let ruumDarkActionText = Color(hex: "6BA8FF")
    static let ruumDarkNeutralBg = Color(hex: "1A2E4A")
    static let ruumDarkNeutralText = Color(hex: "A8B5CC")
    static let ruumDarkWarning = Color(hex: "FFC933")
    static let ruumDarkWarningBg = Color(hex: "3D2E00")
    static let ruumDarkWarningText = Color(hex: "FFC933")
    static let ruumDarkSuccess = Color(hex: "4DD9A3")
    static let ruumDarkSuccessBg = Color(hex: "0A2E1F")
    static let ruumDarkSuccessText = Color(hex: "4DD9A3")
    static let ruumDarkError = Color(hex: "FF6B7A")
    static let ruumDarkErrorBg = Color(hex: "3D0F1A")
    static let ruumDarkErrorText = Color(hex: "FF6B7A")
    static let ruumDarkIncident = Color(hex: "FF5C4D")
    static let ruumDarkIncidentBg = Color(hex: "3D0F0A")
    static let ruumDarkIncidentText = Color(hex: "FF8A7A")
    static let ruumDarkEmergency = Color(hex: "FF4D3D")
    static let ruumDarkEmergencyBg = Color(hex: "3D0A05")
    static let ruumDarkEmergencyText = Color(hex: "FF4D3D")
    // Logotipo (cap. 10–12): RR blanco sobre navy en oscuro; swoosh/pin teal sin cambios.
    static let ruumDarkLogoRR = Color(hex: "FFFFFF")
    static let ruumDarkLogoBg = Color(hex: "0A2342")
}
