"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className = "", width = 120, height = 40 }: LogoProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Detectar tema escuro via media query como fallback
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const checkTheme = () => {
      // Verificar se há classe dark no html ou preferência do sistema
      const htmlElement = document.documentElement
      const hasDarkClass = htmlElement.classList.contains('dark')
      const systemDark = mediaQuery.matches
      setIsDark(hasDarkClass || systemDark)
    }

    checkTheme()
    
    // Observer para mudanças na classe dark
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })

    // Listener para mudanças na preferência do sistema
    mediaQuery.addEventListener('change', checkTheme)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkTheme)
    }
  }, [])

  return (
    <Image
      src={isDark ? "/Logotipo-FVstudios-Branco.png" : "/Logotipo-FVstudios-Preto.png"}
      alt="FVSTUDIOS"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority
    />
  )
}
