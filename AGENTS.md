# Project Guidelines: Supercampus Mobile App (React Native & Expo Router)

This is an Expo / React Native mobile application built for both **iOS** and **Android**. Prioritize cross-platform compatibility, mobile ergonomics, performance, and modern aesthetics.

---

## 1. Core Stack & Environment

- **Framework**: Expo (SDK 57) with Expo Router (File-based routing under `src/app/`)
- **Language**: TypeScript (`tsconfig.json` paths `@/*` -> `./src/*`)
- **Platforms**: Android & iOS (also supports Web previews)
- **Styling**: Tailwind CSS / NativeWind styling paradigms & structured design tokens (`src/constants/theme.ts`)
- **Theme**: Premium **Black & Electric Blue** Dark Palette
- **Project Root**: `supercampus_frontend`. Run `npm start`, `npx expo run:android`, and `npx expo run:ios` from this folder.

---

## 2. Directory & Architecture Structure

```text
supercampus_frontend/
├── assets/                  # Icons, splash screens, custom fonts, images
├── src/
│   ├── app/                 # Expo Router routes (screens only)
│   │   ├── _layout.tsx      # Root provider & navigation container
│   │   ├── (auth)/          # Authentication route group
│   │   │   ├── login.tsx    # Login Screen (Black & Blue Theme)
│   │   │   ├── register.tsx # Registration Screen
│   │   │   └── forgot-password.tsx
│   │   └── (tabs)/          # Main authenticated dashboard tabs
│   │       ├── _layout.tsx
│   │       ├── index.tsx    # Home / Feed
│   │       └── profile.tsx  # User Profile
│   ├── components/          # Reusable, modular UI components
│   │   ├── ui/              # Atom components (Button, Input, Card, Badge)
│   │   ├── auth/            # Auth-specific widgets (LoginForm, SocialButtons)
│   │   └── layout/          # Screen wrappers (SafeContainer, KeyboardView)
│   ├── constants/           # Design tokens, color palette, dimensions
│   │   ├── colors.ts        # Black & Blue color definitions
│   │   └── theme.ts         # Typography, spacing, borders, shadows
│   ├── hooks/               # Custom React hooks (useAuth, useKeyboard, useTheme)
│   ├── services/            # API client, AsyncStorage / SecureStore helpers
│   ├── types/               # TypeScript interfaces & types
│   └── utils/               # Validation, formatting, and helper utilities
├── app.json                 # Expo configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json            # Path aliases and TS rules
```

---

## 3. Design System: Black & Electric Blue Theme

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `background.primary` | `#080B11` | Deep Obsidian Black main screen background |
| `background.secondary` | `#0F172A` | Elevated card & modal container surface |
| `background.input` | `#111827` | Input field background |
| `border.subtle` | `#1E293B` | Card & field borders |
| `border.focus` | `#3B82F6` | Active input focus ring & highlights |
| `primary.main` | `#2563EB` | Primary brand electric blue |
| `primary.light` | `#38BDF8` | Cyan / Sky accent & gradient highlights |
| `primary.hover` | `#1D4ED8` | Pressed state for buttons |
| `text.primary` | `#F8FAFC` | Bright crisp white text for titles and inputs |
| `text.secondary` | `#94A3B8` | Muted slate text for labels and placeholders |
| `text.accent` | `#60A5FA` | Interactive links and button text |
| `status.error` | `#EF4444` | Validation error text & border indicators |

---

## 4. Cross-Platform Guidelines (Android & iOS)

1. **Safe Area & Status Bar**:
   - Always wrap screens with `react-native-safe-area-context`'s `SafeAreaView` or use `useSafeAreaInsets()`.
   - Configure `<StatusBar style="light" />` to ensure white status bar icons on the black background across both iOS and Android.
2. **Keyboard Handling**:
   - Always wrap input forms in `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`.
   - Use `TouchableWithoutFeedback` or `KeyboardAwareScrollView` with `keyboardShouldPersistTaps="handled"` so tapping outside dismisses the keyboard.
3. **Touch Feedback**:
   - Use `Pressable` with `style={({ pressed }) => [...]}` or `TouchableOpacity` with `activeOpacity={0.8}` for smooth interactive feedback on both platforms.
4. **Android Native Navigation Bar**:
   - Ensure bottom padding accounts for Android gesture bar / system buttons using insets.

---

## 5. Coding Principles

- **Separation of Concerns**: Keep route files in `src/app/` lean. Logic, forms, and UI primitives belong in `src/components/`, `src/hooks/`, and `src/services/`.
- **Form Validation**: Always validate user input (email regex, password length) with clear inline error messaging.
- **Accessibility**: Provide `accessibilityLabel`, `accessibilityRole`, and `hitSlop` on interactive buttons.
- **Type Safety**: Strictly type all props, navigation params, and state.
- **Verification**: Run `npx tsc --noEmit` and `npx expo lint` before finalizing edits.
