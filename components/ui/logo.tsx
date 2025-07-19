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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const checkTheme = () => {
      // Verificar preferência do sistema
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      // Verificar classe dark no html
      const htmlDark = document.documentElement.classList.contains('dark')
      setIsDark(htmlDark || systemDark)
    }

    checkTheme()
    
    // Observer para mudanças na classe dark
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })

    // Listener para mudanças do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkTheme)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkTheme)
    }
  }, [])

  // Mostrar fallback durante SSR
  if (!mounted) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-lg font-bold text-gray-700 dark:text-gray-300">FVSTUDIOS</span>
      </div>
    )
  }

  const logoSrc = isDark ? "/Logotipo-FVstudios-Branco.png" : "/Logotipo-FVstudios-Preto.png"

  return (
    <Image
      src={logoSrc}
      alt="FVSTUDIOS"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority
      onError={(e) => {
        console.error('Logo failed to load:', logoSrc)
      }}
    />
  )
}
