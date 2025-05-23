"use client"

import { IconButton, Box, Skeleton, Button } from "@chakra-ui/react"
import type { IconButtonProps } from "@chakra-ui/react"
import { ThemeProvider, useTheme } from "next-themes"
// import type { ThemeProviderProps } from "next-themes" // Removed: not exported by next-themes
import * as React from "react"
import { LuMoon, LuSun } from "react-icons/lu"
// import { MoonIcon, SunIcon } from '@chakra-ui/icons' // Removed: not installed or needed

// Removed extension of ThemeProviderProps, as it's not exported by next-themes
export interface ColorModeProviderProps {}

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  )
}

export type ColorMode = "light" | "dark"

export interface UseColorModeReturn {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  toggleColorMode: () => void
}

export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, setTheme } = useTheme()
  const toggleColorMode = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }
  return {
    colorMode: resolvedTheme as ColorMode,
    setColorMode: setTheme,
    toggleColorMode,
  }
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode()
  return colorMode === "dark" ? dark : light
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode()
  return colorMode === "dark" ? <LuMoon /> : <LuSun />
}

interface ColorModeButtonProps extends Omit<IconButtonProps, "aria-label"> {}

export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButton(props, ref) {
  const { toggleColorMode } = useColorMode()
  return (
    <React.Suspense fallback={<Skeleton boxSize="8" />}>
      <IconButton
        onClick={toggleColorMode}
        variant="ghost"
        aria-label="Toggle color mode"
        size="sm"
        ref={ref}
        {...props}
      >
        <ColorModeIcon />
      </IconButton>
    </React.Suspense>
  )
})

export const LightMode = React.forwardRef<HTMLDivElement>(
  function LightMode(props, ref) {
    return (
      <Box
        color="gray.800"
        display="contents"
        className="chakra-theme light"
        ref={ref}
        {...props}
      />
    )
  },
)

export const DarkMode = React.forwardRef<HTMLDivElement>(
  function DarkMode(props, ref) {
    return (
      <Box
        color="gray.200"
        display="contents"
        className="chakra-theme dark"
        ref={ref}
        {...props}
      />
    )
  },
)

// Use LuMoon/LuSun icons instead of Chakra UI icons for toggle button
export function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Button onClick={toggleColorMode} size="sm">
      {colorMode === 'light' ? <LuMoon /> : <LuSun />}
    </Button>
  );
}
