export const PLATFORM_RULES: Record<string, Record<string, { recommended?: boolean; spec: string }>> = {
  'Amazon US': {
    'auto-resize': { 
      recommended: true, 
      spec: 'Platform spec: 2000×2000px minimum; 3000×3000px recommended' 
    },
    'bg-color': { 
      spec: 'Platform spec: White or light grey background — no busy or dark backgrounds' 
    },
    'aspect-ratio': { 
      spec: 'Platform spec: 1:1 square required for main image' 
    },
    'white-bg': { 
      recommended: true, 
      spec: 'Platform spec: Must be white or very light grey — AI validation flags violations' 
    },
    'infographic': { 
      spec: 'Platform spec: Secondary images: feature callouts allowed, <25% text coverage' 
    },
    'watermark': { 
      spec: 'Platform spec: Supplier watermarks strictly prohibited — AI removal on ingest' 
    },
    'text-overlay': { 
      spec: 'Platform spec: No promotional text, prices, or store branding on main image' 
    },
    'variant': { 
      spec: 'Platform spec: Variant swatch at 200×200px; each color needs unique hero image' 
    },
  },
  'Walmart': {
    'auto-resize': { 
      recommended: true, 
      spec: 'Platform spec: 2000×2000px minimum; 3000×3000px recommended' 
    },
    'bg-color': { 
      spec: 'Platform spec: White or light grey background — no busy or dark backgrounds' 
    },
    'aspect-ratio': { 
      spec: 'Platform spec: 1:1 square required for main image' 
    },
    'white-bg': { 
      spec: 'Platform spec: Must be white or very light grey — AI validation flags violations' 
    },
    'infographic': { 
      spec: 'Platform spec: Secondary images: feature callouts allowed, <25% text coverage' 
    },
    'watermark': { 
      spec: 'Platform spec: Supplier watermarks strictly prohibited — AI removal on ingest' 
    },
    'text-overlay': { 
      spec: 'Platform spec: No promotional text, prices, or store branding on main image' 
    },
    'variant': { 
      spec: 'Platform spec: Variant swatch at 200×200px; each color needs unique hero image' 
    },
  },
  'eBay': {
    'auto-resize': { 
      spec: 'Platform spec: Min 500px, max 9000px on longest side; 1600px+ recommended' 
    },
    'bg-color': { 
      spec: 'Platform spec: White or neutral background preferred — no busy patterns' 
    },
    'aspect-ratio': { 
      spec: 'Platform spec: No strict requirement; square or 4:3 recommended for listings' 
    },
    'white-bg': { 
      spec: 'Platform spec: Not enforced, but flagged if background significantly impacts clarity' 
    },
    'infographic': { 
      spec: 'Platform spec: 12 images max per listing; secondary images can include callouts' 
    },
    'watermark': { 
      recommended: true, 
      spec: 'Platform spec: Watermarks, logos, and decorative borders are prohibited by eBay policy' 
    },
    'text-overlay': { 
      spec: 'Platform spec: No URLs, seller info, or promotional text permitted on images' 
    },
    'variant': { 
      spec: 'Platform spec: Each variant should have its own distinct listing image' 
    },
  },
  'Wayfair': {
    'auto-resize': { 
      recommended: true, 
      spec: 'Platform spec: Min 2000×2000px; 4000×4000px for hero images' 
    },
    'bg-color': { 
      spec: 'Platform spec: Pure white or photorealistic lifestyle room setting — no flat grey' 
    },
    'aspect-ratio': { 
      spec: 'Platform spec: 1:1 square for main; 16:9 accepted for room scene images' 
    },
    'white-bg': { 
      spec: 'Platform spec: White background products must pass 255/255/255 RGB validation' 
    },
    'infographic': { 
      spec: 'Platform spec: Dimension callout images required for furniture — auto-generated overlay' 
    },
    'watermark': { 
      spec: 'Platform spec: Zero tolerance — Wayfair supplier agreement prohibits watermarks' 
    },
    'text-overlay': { 
      spec: 'Platform spec: Dimension text overlays allowed on secondary images only' 
    },
    'variant': { 
      recommended: true, 
      spec: 'Platform spec: Each fabric/finish variant requires unique room scene or swatch image' 
    },
  },
};