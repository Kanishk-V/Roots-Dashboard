"use client"

import { useToast, UseToastOptions } from "@chakra-ui/react";

/**
 * useAppToast - Custom hook to show toast notifications using Chakra UI's useToast.
 *
 * Usage:
 *   const toast = useAppToast();
 *   toast({ title: "Success!", status: "success" });
 */
export function useAppToast() {
  return useToast();
}

/**
 * Toaster - (Optional) Placeholder for a global toaster component.
 * Chakra UI handles toasts globally, so this can be left empty or used for future customization.
 */
export function Toaster() {
  // Chakra UI toasts are rendered via Portal automatically.
  return null;
}
