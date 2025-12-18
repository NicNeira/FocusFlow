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
        className="w-full px-4 py-3 rounded-xl flex items-center justify-between gap-3 transition-all duration-200"
        style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${isOpen ? "var(--glass-border-hover)" : "var(--glass-border)"}`,
          color: "var(--text-primary)",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Icon with color */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: `${selectedTechnique?.color}15`,
              color: selectedTechnique?.color,
            }}
          >
            {selectedTechnique?.icon}
          </div>

          {/* Text content */}
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {selectedTechnique?.name}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {selectedTechnique?.workTime} / {selectedTechnique?.breakTime}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          className="absolute z-50 w-full mt-2 py-2 rounded-xl overflow-hidden animate-fade-in"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
          }}
        >
          {techniques.map((technique) => {
            const isSelected = technique.type === currentTechnique;

            return (
              <button
                key={technique.type}
                type="button"
                onClick={() => handleSelect(technique.type)}
                className="w-full px-4 py-3 flex items-center gap-3 transition-all duration-150"
                style={{
                  background: isSelected ? "var(--bg-elevated)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "var(--bg-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: `${technique.color}15`,
                    color: technique.color,
                  }}
                >
                  {technique.icon}
                </div>

                {/* Text */}
                <div className="flex flex-col items-start flex-1">
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: isSelected ? technique.color : "var(--text-primary)",
                    }}
                  >
                    {technique.name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {technique.workTime} trabajo / {technique.breakTime} descanso
                  </span>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: technique.color,
                      boxShadow: `0 0 8px ${technique.color}`,
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
