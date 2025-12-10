"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"

interface MermaidDiagramProps {
  chart: string
}

let mermaidInitialized = false

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>("")

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidInitialized) {
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          themeVariables: {
            fontSize: "8px", // 50% of default 16px body text
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          },
        })
        mermaidInitialized = true
      }

      try {
        // Sanitize chart to fix common issues
        let sanitizedChart = chart

        // CRITICAL FIX: Remove escaped quotes \" -> "
        // This fixes the issue where JSON escaping creates invalid mermaid syntax
        sanitizedChart = sanitizedChart.replace(/\\"/g, '"')

        // Fix newlines within flowchart labels by removing them
        // Handle both square brackets ["text"] and curly braces {"text"}

        // Fix square bracket labels: A["text\nmore"] -> A["text more"]
        sanitizedChart = sanitizedChart.replace(
          /\["([^"]*?)"\]/gs,
          (match, content) => {
            const cleanContent = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
            return `["${cleanContent}"]`
          }
        )

        // Fix curly brace labels: B{"text\nmore"} -> B{"text more"}
        sanitizedChart = sanitizedChart.replace(
          /\{"([^"]*?)"\}/gs,
          (match, content) => {
            const cleanContent = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
            return `{"${cleanContent}"}`
          }
        )

        // Fix parentheses labels: C("text\nmore") -> C("text more")
        sanitizedChart = sanitizedChart.replace(
          /\("([^"]*?)"\)/gs,
          (match, content) => {
            const cleanContent = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
            return `("${cleanContent}")`
          }
        )

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        const { svg: renderedSvg } = await mermaid.render(id, sanitizedChart)
        setSvg(renderedSvg)
      } catch (error) {
        console.error("Mermaid rendering error:", error)
        console.error("Problematic chart:", chart)
        // If rendering fails, display the raw chart as fallback
        if (ref.current) {
          ref.current.textContent = chart
        }
      }
    }

    renderDiagram()
  }, [chart])

  return <div ref={ref} className="my-4" dangerouslySetInnerHTML={{ __html: svg }} />
}
