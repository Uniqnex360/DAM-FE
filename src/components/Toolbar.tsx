import { MousePointer, Minus, Ruler } from 'lucide-react';

interface ToolbarProps {
  activeTool: 'select' | 'line' | 'ruler';
  onToolChange: (tool: 'select' | 'line' | 'ruler') => void;
}

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select' },
    { id: 'line' as const, icon: Minus, label: 'Line' },
    { id: 'ruler' as const, icon: Ruler, label: 'Ruler' },
  ];

  return (
    <div className="flex gap-2 p-4 bg-white border-b border-gray-200">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTool === tool.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={tool.label}
        >
          <tool.icon className="w-5 h-5" />
          <span className="font-medium">{tool.label}</span>
        </button>
      ))}
    </div>
  );
}
