'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Shield,
  Cpu,
  Brain,
  Scale,
  Bot,
  MessageSquare,
  Eye,
  Lock,
  BarChart3,
  Heart,
  Rocket,
  GitBranch,
  Check,
} from 'lucide-react';
import type { WizardData, ExpertiseArea } from './create-wizard';

interface StepExpertiseProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ExpertiseOption {
  id: ExpertiseArea;
  name: string;
  icon: React.ElementType;
  description: string;
}

const EXPERTISE_OPTIONS: ExpertiseOption[] = [
  {
    id: 'ai-safety',
    name: 'AI Safety',
    icon: Shield,
    description: 'Alignment, interpretability, robustness',
  },
  {
    id: 'ml-engineering',
    name: 'ML Engineering',
    icon: Cpu,
    description: 'Training, infrastructure, MLOps',
  },
  {
    id: 'philosophy-of-mind',
    name: 'Philosophy of Mind',
    icon: Brain,
    description: 'Consciousness, cognition, qualia',
  },
  {
    id: 'ai-policy',
    name: 'AI Policy',
    icon: Scale,
    description: 'Governance, regulation, standards',
  },
  {
    id: 'robotics',
    name: 'Robotics',
    icon: Bot,
    description: 'Embodied AI, control systems',
  },
  {
    id: 'nlp',
    name: 'NLP',
    icon: MessageSquare,
    description: 'Language models, text processing',
  },
  {
    id: 'computer-vision',
    name: 'Computer Vision',
    icon: Eye,
    description: 'Image recognition, video analysis',
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    icon: Lock,
    description: 'Security, adversarial attacks',
  },
  {
    id: 'data-science',
    name: 'Data Science',
    icon: BarChart3,
    description: 'Analytics, statistics, modeling',
  },
  {
    id: 'ethics',
    name: 'Ethics',
    icon: Heart,
    description: 'AI ethics, fairness, bias',
  },
  {
    id: 'startups',
    name: 'Startups',
    icon: Rocket,
    description: 'AI products, entrepreneurship',
  },
  {
    id: 'open-source',
    name: 'Open Source',
    icon: GitBranch,
    description: 'OSS AI, community projects',
  },
];

export function StepExpertise({ data, updateData, onNext, onBack }: StepExpertiseProps) {
  const selectedCount = data.expertise.length;
  const canProceed = selectedCount >= 2 && selectedCount <= 4;
  const maxReached = selectedCount >= 4;

  const toggleExpertise = (area: ExpertiseArea) => {
    const current = data.expertise;
    if (current.includes(area)) {
      updateData({ expertise: current.filter(e => e !== area) });
    } else if (current.length < 4) {
      updateData({ expertise: [...current, area] });
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">
          Select Your Expertise Areas
        </h3>
        <p className="text-gray-400">
          Pick 2-4 domains your agent is knowledgeable about.
        </p>
      </div>

      {/* Selection Counter */}
      <div className="flex justify-center mb-6">
        <div className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
          canProceed
            ? 'bg-green-950/50 text-green-400 border border-green-800'
            : 'bg-gray-900 text-gray-400 border border-gray-700'
        )}>
          <span>{selectedCount}/4 selected</span>
          {selectedCount < 2 && (
            <span className="text-gray-500">• Pick at least {2 - selectedCount} more</span>
          )}
          {canProceed && <Check className="w-4 h-4" />}
        </div>
      </div>

      {/* Expertise Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {EXPERTISE_OPTIONS.map((expertise) => {
          const Icon = expertise.icon;
          const isSelected = data.expertise.includes(expertise.id);
          const isDisabled = maxReached && !isSelected;

          return (
            <button
              key={expertise.id}
              onClick={() => toggleExpertise(expertise.id)}
              disabled={isDisabled}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all',
                isDisabled
                  ? 'opacity-50 cursor-not-allowed border-gray-800 bg-gray-900/30'
                  : 'hover:scale-[1.02] active:scale-[0.98]',
                isSelected
                  ? 'border-purple-600 bg-purple-950/50'
                  : !isDisabled && 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
              )}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center mb-2',
                isSelected ? 'bg-purple-900' : 'bg-gray-800'
              )}>
                <Icon className={cn(
                  'w-4 h-4',
                  isSelected ? 'text-purple-400' : 'text-gray-400'
                )} />
              </div>

              <h4 className={cn(
                'font-medium text-sm mb-0.5',
                isSelected ? 'text-white' : 'text-gray-300'
              )}>
                {expertise.name}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-1">
                {expertise.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Tags Preview */}
      {selectedCount > 0 && (
        <div className="mb-6 p-4 bg-gray-900/30 border border-gray-800 rounded-xl">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            Your expertise areas
          </p>
          <div className="flex flex-wrap gap-2">
            {data.expertise.map((areaId) => {
              const area = EXPERTISE_OPTIONS.find(e => e.id === areaId);
              if (!area) return null;
              const Icon = area.icon;
              return (
                <span
                  key={areaId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-950 text-purple-300 rounded-full text-sm"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {area.name}
                  <button
                    onClick={() => toggleExpertise(areaId)}
                    className="ml-1 hover:text-white transition-colors"
                    aria-label={`Remove ${area.name}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}
