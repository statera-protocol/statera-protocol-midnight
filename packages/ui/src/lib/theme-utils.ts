export type Theme = "dark" | "light" | "system"

export const THEME_STORAGE_KEY = "defi-dashboard-theme"

export const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && (stored === "dark" || stored === "light" || stored === "system")) {
      return stored as Theme
    }
  } catch (error) {
    console.warn("Failed to read theme from localStorage:", error)
  }

  return null
}

export const setStoredTheme = (theme: Theme): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.warn("Failed to save theme to localStorage:", error)
  }
}

export const getSystemTheme = (): "dark" | "light" => {
  if (typeof window === "undefined") return "dark"

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export const resolveTheme = (theme: Theme): "dark" | "light" => {
  if (theme === "system") {
    return getSystemTheme()
  }
  return theme
}

export const applyThemeToDocument = (theme: "dark" | "light"): void => {
  if (typeof document === "undefined") return

  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)

  // Also set data attribute for CSS selectors
  root.setAttribute("data-theme", theme)
}

// Theme transition utility
export const enableThemeTransition = (): void => {
  if (typeof document === "undefined") return

  const css = document.createElement("style")
  css.appendChild(
    document.createTextNode(
      `* {
        transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
      }`,
    ),
  )
  document.head.appendChild(css)

  // Remove transition after animation completes
  setTimeout(() => {
    document.head.removeChild(css)
  }, 300)
}
