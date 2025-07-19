"use client"

import { useEffect, useState } from "react"

interface SimpleLogoProps {
  className?: string
  width?: number
  height?: number
}

export function SimpleLogo({ className = "", width = 120, height = 40 }: SimpleLogoProps) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const checkTheme = () => {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const htmlDark = document.documentElement.classList.contains('dark')
      setIsDark(htmlDark || systemDark)
    }

    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkTheme)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkTheme)
    }
  }, [])

  if (!mounted) {
    return <span className="text-lg font-bold">FVSTUDIOS</span>
  }

  const logoSrc = isDark ? "/Logotipo-FVstudios-Branco.png" : "/Logotipo-FVstudios-Preto.png"

  return (
    <img
      src={logoSrc}
      alt="FVSTUDIOS"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      onError={(e) => {
        console.error('Logo failed to load:', logoSrc)
        e.currentTarget.style.display = 'none'
      }}
      onLoad={() => {
        console.log('Logo loaded:', logoSrc)
      }}
    />
  )
}
