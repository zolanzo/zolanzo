import { useState, useCallback } from "react";

export interface PhoneGateOptions {
  actionName: string;
  onSuccess: () => void;
}

export function usePhoneGate() {
  const [isOpen, setIsOpen] = useState(false);
  const [actionName, setActionName] = useState("");
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const triggerGate = useCallback((action: string, callback: () => void, isPhoneVerified: boolean = false) => {
    if (isPhoneVerified) {
      callback();
      return;
    }

    setActionName(action);
    setPendingCallback(() => callback);
    setIsOpen(true);
  }, []);

  const handleVerified = useCallback(() => {
    setIsOpen(false);
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  }, [pendingCallback]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPendingCallback(null);
  }, []);

  return {
    isOpen,
    actionName,
    triggerGate,
    handleVerified,
    handleClose,
  };
}
