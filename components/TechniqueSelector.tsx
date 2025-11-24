import React from "react";
import { StudyTechnique } from "../types";
import { Clock, Timer, Zap } from "lucide-react";

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
  const techniques: Array<{
    type: StudyTechnique;
    name: string;
    icon: React.ReactNode;
    workTime: string;
    breakTime: string;
  }> = [
    {
      type: "libre",
      name: "Libre",
      icon: <Zap className="w-4 h-4" />,
      workTime: "∞",
      breakTime: "-",
    },
    {
      type: "pomodoro",
      name: "Pomodoro",
      icon: <Timer className="w-4 h-4" />,
      workTime: "25min",
      breakTime: "5min",
    },
    {
      type: "52-17",
      name: "52-17",
      icon: <Clock className="w-4 h-4" />,
      workTime: "52min",
      breakTime: "17min",
    },
  ];

  const selectedTechnique = techniques.find((t) => t.type === currentTechnique);

  return (
    <div className="relative">
      <select
        value={currentTechnique}
        onChange={(e) => onSelectTechnique(e.target.value as StudyTechnique)}
        disabled={disabled}
        className={`
          appearance-none w-full px-4 py-2.5 pr-10 rounded-xl
          border font-medium text-sm
          transition
          ${
            disabled
              ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
              : "cursor-pointer bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
          }
          text-slate-800 dark:text-slate-100
          outline-none
        `}
      >
        {techniques.map((technique) => (
          <option key={technique.type} value={technique.type}>
            {technique.name} ({technique.workTime}/{technique.breakTime})
          </option>
        ))}
      </select>

      {/* Icono custom */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-2">
        <div className="text-primary-600 dark:text-primary-400">
          {selectedTechnique?.icon}
        </div>
        <svg
          className="w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
};

export default TechniqueSelector;
