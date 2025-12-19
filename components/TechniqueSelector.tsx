import React, { useState, useRef, useEffect } from "react";
import { StudyTechnique } from "../types";
import { Clock, Timer, Zap, ChevronDown } from "lucide-react";

interface TechniqueSelectorProps {
  currentTechnique: StudyTechnique;
  onSelectTechnique: (technique: StudyTechnique) => void;
  disabled?: boolean;
}

const TechniqueSelector: React.FC<TechniqueSelectorProps> = ({
  currentTechnique,
  onSelectTechnique,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const techniques: Array<{
    type: StudyTechnique;
    name: string;
    icon: React.ReactNode;
    workTime: string;
    breakTime: string;
    color: string;
  }> = [
    {
      type: "libre",
      name: "Libre",
      icon: <Zap className="w-4 h-4" />,
      workTime: "∞",
      breakTime: "-",
      color: "var(--accent-violet)",
    },
    {
      type: "pomodoro",
      name: "Pomodoro",
      icon: <Timer className="w-4 h-4" />,
      workTime: "25min",
      breakTime: "5min",
      color: "var(--accent-cyan)",
    },
    {
      type: "52-17",
      name: "52-17",
      icon: <Clock className="w-4 h-4" />,
      workTime: "52min",
      breakTime: "17min",
      color: "var(--accent-magenta)",
    },
  ];

  const selectedTechnique = techniques.find((t) => t.type === currentTechnique);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (type: StudyTechnique) => {
    onSelectTechnique(type);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full group/btn px-0 py-1 flex items-center justify-between gap-4 transition-all duration-300 outline-none"
        style={{
          background: "transparent",
          color: "var(--text-primary)",
          opacity: disabled ? 0.3 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Icon with subtle background */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 group-hover/btn:scale-110"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              color: selectedTechnique?.color,
            }}
          >
            {selectedTechnique?.icon}
          </div>

          {/* Text content */}
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {selectedTechnique?.name}
            </span>
            <span className="text-[10px] font-medium opacity-40 uppercase tracking-widest">
              {selectedTechnique?.workTime} focus
            </span>
          </div>
        </div>

        {/* Minimalist Chevron */}
        <div className={`p-1 rounded-full transition-all duration-300 ${isOpen ? "bg-white/10 rotate-180" : "bg-transparent"}`}>
          <ChevronDown
            className="w-3.5 h-3.5 opacity-20"
          />
        </div>
      </button>

      {/* Dropdown Menu - Modern & Sharp */}
      {isOpen && !disabled && (
        <div
          className="absolute z-50 w-full mt-4 py-2 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            background: "rgba(10, 10, 10, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          {techniques.map((technique) => {
            const isSelected = technique.type === currentTechnique;

            return (
              <button
                key={technique.type}
                type="button"
                onClick={() => handleSelect(technique.type)}
                className="w-full px-4 py-4 flex items-center gap-4 transition-all duration-200"
                style={{
                  background: isSelected ? "rgba(255, 255, 255, 0.03)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {/* Minimal Icon */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    background: isSelected ? `${technique.color}20` : "rgba(255, 255, 255, 0.02)",
                    color: isSelected ? technique.color : "rgba(255, 255, 255, 0.2)",
                  }}
                >
                  {technique.icon}
                </div>

                {/* Text */}
                <div className="flex flex-col items-start flex-1">
                  <span
                    className={`text-sm tracking-tight ${isSelected ? "font-bold" : "font-medium"}`}
                    style={{
                      color: isSelected ? "white" : "rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    {technique.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest opacity-30 font-bold">
                    {technique.workTime} / {technique.breakTime}
                  </span>
                </div>

                {/* Status Dot */}
                {isSelected && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: technique.color,
                      boxShadow: `0 0 10px ${technique.color}`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TechniqueSelector;
