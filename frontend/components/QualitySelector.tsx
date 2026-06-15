"use client";

import React, { useState, useRef, useEffect } from "react";
import { VideoQuality } from "../types";
import { Settings, Check } from "lucide-react";

interface QualitySelectorProps {
  currentQuality: VideoQuality;
  availableQualities: VideoQuality[];
  onQualityChange: (quality: VideoQuality) => void;
}

export default function QualitySelector({
  currentQuality,
  availableQualities,
  onQualityChange,
}: QualitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings Gear Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 hover:bg-black/90 text-white rounded-lg text-xs font-semibold backdrop-blur-sm transition-colors shadow border border-white/10"
        title="Settings"
      >
        <Settings size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
        <span>Settings</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg border border-border shadow-lg py-1.5 z-50 text-text-primary text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-border mb-1">
            Quality
          </div>
          {availableQualities.map((quality) => (
            <button
              key={quality}
              type="button"
              onClick={() => {
                onQualityChange(quality);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-cardHover transition-colors text-left font-medium"
            >
              <span>{quality}</span>
              {currentQuality === quality && <Check size={12} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
