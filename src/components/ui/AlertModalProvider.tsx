import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, AlertButton, AlertOptions } from 'react-native';

import { AppMessageModal, AppMessageType } from './AppMessageModal';

interface AlertState {
  visible: boolean;
  type: AppMessageType;
  title: string;
  message: string;
  primaryButtonText?: string;
  onPrimaryPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
}

interface AlertContextType {
  showAlert: (
    title: string,
    message?: string,
    type?: AppMessageType,
    buttons?: AlertButton[],
  ) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
});

export function useAppAlert() {
  return useContext(AlertContext);
}

// Global alert bridge to capture Alert.alert from anywhere in the app
let globalShowAlert:
  | ((title: string, message?: string, type?: AppMessageType, buttons?: AlertButton[]) => void)
  | null = null;

let globalHideAlert: (() => void) | null = null;

export function showGlobalAlert(
  title: string,
  message?: string,
  type?: AppMessageType,
  buttons?: AlertButton[],
) {
  if (globalShowAlert) {
    globalShowAlert(title, message, type, buttons);
  } else {
    Alert.alert(title, message, buttons);
  }
}

export function AlertModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const hideAlert = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const triggerAlert = useCallback(
    (title: string, message = '', typeOverride?: AppMessageType, buttons?: AlertButton[]) => {
      let resolvedType: AppMessageType = typeOverride || 'info';

      if (!typeOverride) {
        const text = `${title} ${message}`.toLowerCase();
        if (
          text.includes('error') ||
          text.includes('failed') ||
          text.includes('could not') ||
          text.includes('invalid') ||
          text.includes('denied') ||
          text.includes('reject')
        ) {
          resolvedType = 'error';
        } else if (
          text.includes('success') ||
          text.includes('published') ||
          text.includes('submitted') ||
          text.includes('approved') ||
          text.includes('saved') ||
          text.includes('updated') ||
          text.includes('deleted')
        ) {
          resolvedType = 'success';
        } else if (
          text.includes('warning') ||
          text.includes('delete') ||
          text.includes('required') ||
          text.includes('limit') ||
          text.includes('missing') ||
          text.includes('cancel')
        ) {
          resolvedType = 'warning';
        }
      }

      let primaryText = 'OK';
      let onPrimary: (() => void) | undefined;
      let secondaryText: string | undefined;
      let onSecondary: (() => void) | undefined;

      if (Array.isArray(buttons) && buttons.length > 0) {
        if (buttons.length === 1) {
          primaryText = buttons[0].text || 'OK';
          onPrimary = () => {
            hideAlert();
            buttons[0].onPress?.();
          };
        } else {
          const cancelBtn = buttons.find((b) => b.style === 'cancel') || buttons[0];
          const actionBtn = buttons.find((b) => b !== cancelBtn) || buttons[1];

          secondaryText = cancelBtn.text || 'Cancel';
          onSecondary = () => {
            hideAlert();
            cancelBtn.onPress?.();
          };

          primaryText = actionBtn.text || 'OK';
          if (actionBtn.style === 'destructive') {
            resolvedType = 'error';
          }
          onPrimary = () => {
            hideAlert();
            actionBtn.onPress?.();
          };
        }
      } else {
        onPrimary = () => hideAlert();
      }

      setState({
        visible: true,
        type: resolvedType,
        title: title || 'Notice',
        message: message || '',
        primaryButtonText: primaryText,
        onPrimaryPress: onPrimary,
        secondaryButtonText: secondaryText,
        onSecondaryPress: onSecondary,
      });
    },
    [hideAlert],
  );

  useEffect(() => {
    globalShowAlert = triggerAlert;
    globalHideAlert = hideAlert;

    // Intercept React Native's static Alert.alert
    const originalAlert = Alert.alert;
    Alert.alert = (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      _options?: AlertOptions,
    ) => {
      triggerAlert(title, message, undefined, buttons);
    };

    return () => {
      globalShowAlert = null;
      globalHideAlert = null;
      Alert.alert = originalAlert;
    };
  }, [triggerAlert, hideAlert]);

  return (
    <AlertContext.Provider value={{ showAlert: triggerAlert, hideAlert }}>
      {children}
      <AppMessageModal
        visible={state.visible}
        type={state.type}
        title={state.title}
        message={state.message}
        primaryButtonText={state.primaryButtonText}
        onPrimaryPress={state.onPrimaryPress}
        secondaryButtonText={state.secondaryButtonText}
        onSecondaryPress={state.onSecondaryPress}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
}
