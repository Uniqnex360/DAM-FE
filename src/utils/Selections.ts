import { BarChart, Box, Cloud, Crop, FileText, Globe, ImageIcon, Maximize, Minimize2, Palette, Ruler, Shield, Sparkles, Type, Upload } from "lucide-react";
import { Link } from "react-router-dom";
export const BG_COLOR_PRESETS = [
    { label: "White", value: "#FFFFFF", preview: "bg-white border-slate-200" },
    {
      label: "Light Gray",
      value: "#F5F5F5",
      preview: "bg-[#F5F5F5] border-slate-200",
    },
    {
      label: "Dark Gray",
      value: "#E0E0E0",
      preview: "bg-[#E0E0E0] border-slate-300",
    },
    { label: "Black", value: "#000000", preview: "bg-black border-slate-700" },
    {
      label: "Transparent",
      value: "transparent",
      preview: "bg-slate-100 border-slate-200",
    },
  ];
export const ECOMMERCE_DESTINATIONS = [
  {
    id: "unified-commerce",
    label: "Unified E-Commerce",
    initial: "U",
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-100",
  },
  {
    id: "shopify",
    label: "Shopify",
    initial: "S",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
  {
    id: "woocommerce",
    label: "WooCommerce",
    initial: "W",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-100",
  },
  {
    id: "magento",
    label: "Magento",
    initial: "M",
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
  },
  {
    id: "bigcommerce",
    label: "BigCommerce",
    initial: "B",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  {
    id: "wix-store",
    label: "Wix Store",
    initial: "W",
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-100",
  },
];
export const SOURCES = [
  { id: "files", label: "Files", icon: Upload },
  { id: "urls", label: "URLs", icon: Link },
  { id: "csv", label: "CSV", icon: FileText },
  { id: "page", label: "Page", icon: Globe },
  { id: "cloud", label: "Cloud", icon: Cloud },
];
export const MARKETPLACE_DESTINATIONS = [
  {
    id: "amazon-us",
    label: "Amazon US",
    initial: "Am",
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
  },
  {
    id: "amazon-uk",
    label: "Amazon UK",
    initial: "Am",
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
  },
  {
    id: "walmart",
    label: "Walmart",
    initial: "Wa",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  {
    id: "wayfair-us",
    label: "Wayfair US",
    initial: "Wa",
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
  },
  {
    id: "wayfair-uk",
    label: "Wayfair UK",
    initial: "Wa",
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
  },
  {
    id: "ebay-us",
    label: "eBay US",
    initial: "eB",
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
  },
  {
    id: "ebay-uk",
    label: "eBay UK",
    initial: "eB",
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
  },
  {
    id: "target-plus",
    label: "Target Plus",
    initial: "Tg",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-100",
  },
  {
    id: "tiktok-shop",
    label: "TikTok Shop",
    initial: "TT",
    bg: "bg-black/5",
    text: "text-black",
    border: "border-slate-200",
  },
  {
    id: "homedepot",
    label: "Home Depot",
    initial: "HD",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-100",
  },
];
export const MARKETPLACE_GROUPS = [
  {
    id: "us",
    countryCode: "US",
    countryName: "United States",
    items: MARKETPLACE_DESTINATIONS.filter(
      (d) =>
        d.id === "amazon-us" ||
        d.id === "walmart" ||
        d.id === "wayfair-us" ||
        d.id === "ebay-us" ||
        d.id === "target-plus" ||
        d.id === "tiktok-shop" ||
        d.id === "homedepot",
    ),
  },
  {
    id: "uk",
    countryCode: "UK",
    countryName: "United Kingdom",
    items: MARKETPLACE_DESTINATIONS.filter(
      (d) =>
        d.id === "amazon-uk" || d.id === "wayfair-uk" || d.id === "ebay-uk",
    ),
  },
];
export const PROCESSING_OPTIONS = [
  {
    id: "resize",
    label: "Image Resizing",
    description: "Resize to specific dimensions",
    icon: Ruler,
  },
  {
    id: "image-refill",
    label: "Image Refill / Reconstruction",
    description: "AI-powered completion of cut-off product parts (Outpainting)",
    icon: Maximize,
  },
  {
    id: "watermark-remove",
    label: "Watermark Removal",
    description: "Remove watermarks without affecting product",
    icon: Shield,
  },
  {
    id: "text-remove",
    label: "Text Removal",
    description: "Auto-detect and remove embedded text",
    icon: Type,
  },
  {
    id: "shadow-remove",
    label: "Shadow Removal",
    description: "Remove harsh shadows while preserving natural lighting",
    icon: Sparkles,
  },
  {
    id: "bg-remove",
    label: "Background Removal",
    description: "Remove background automatically",
    icon: Palette,
  },
  {
    id: "retouch",
    label: "Image Retouch / Enhancer",
    description: "Enhance color, sharpness, and quality",
    icon: Sparkles,
  },
  {
    id: "crop",
    label: "Image Cropping / Reframing",
    description: "Smart crop and aspect ratio adjust",
    icon: Crop,
  },
  {
    id: "compress",
    label: "Image Compression",
    description: "Optimize file size without quality loss",
    icon: Minimize2,
  },
  {
    id: "lifestyle",
    label: "Lifestyle Image Creation",
    description: "Generate lifestyle scene images",
    icon: ImageIcon,
  },
  {
    id: "infographic",
    label: "Infographic Creation",
    description: "Auto-generate product infographics",
    icon: BarChart,
  },
  {
    id: "line-diagram",
    label: "Line Diagram",
    description: "Technical line drawing generation",
    icon: Ruler,
  },
  {
    id: "swatch",
    label: "Material Swatch Creation",
    description: "Generate color and material swatches",
    icon: Palette,
  },
  {
    id: "3d-model",
    label: "3D Render",
    description: "Create photorealistic 3D product renders",
    icon: Box,
  },
];