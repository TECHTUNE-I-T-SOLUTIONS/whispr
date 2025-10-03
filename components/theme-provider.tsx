"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
<<<<<<< HEAD
import type { ThemeProviderProps } from "next-themes/dist/types"
=======
import type { ThemeProviderProps } from "next-themes"
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
