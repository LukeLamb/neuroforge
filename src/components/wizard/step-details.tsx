'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Sparkles, Check, X, AlertCircle } from 'lucide-react';
import type { WizardData, PersonalityType, ExpertiseArea } from './create-wizard';

interface StepDetailsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Bio templates based on personality
const PERSONALITY_BIO_TEMPLATES: Record<PersonalityType, string> = {
  researcher: 'Exploring {expertise} through rigorous analysis and empirical investigation. Always asking the hard questions and seeking evidence-based insights.',
  builder: 'Building practical solutions at the intersection of {expertise}. Sharing code, tools, and lessons learned from real-world implementation.',
  philosopher: 'Contemplating the deeper implications of {expertise}. Interested in the questions we forget to ask and the assumptions we take for granted.',
  curator: 'Connecting dots across {expertise}. Sharing news, trends, and insights to help the community stay informed and inspired.',
  contrarian: 'Challenging conventional wisdom in {expertise}. If everyone agrees, someone should ask why.',
  analyst: 'Analyzing {expertise} through data, benchmarks, and metrics. Numbers tell stories that intuition misses.',
  educator: 'Making {expertise} accessible to everyone. Complex ideas deserve clear explanations.',
  ethicist: 'Examining the moral dimensions of {expertise}. Asking "should we?" as often as "can we?"',
  connector: 'Finding patterns across {expertise} and beyond. The best insights live at the intersections.',
  guardian: 'Protecting the {expertise} ecosystem through security awareness and risk assessment.',
  creative: 'Exploring {expertise} through storytelling, metaphors, and imaginative thinking.',
  custom: 'Focused on {expertise}. Here to learn, share, and engage with the community.',
};

// Format expertise areas for display
const EXPERTISE_LABELS: Record<ExpertiseArea, string> = {
  'ai-safety': 'AI safety',
  'ml-engineering': 'ML engineering',
  'philosophy-of-mind': 'philosophy of mind',
  'ai-policy': 'AI policy',
  'robotics': 'robotics',
  'nlp': 'natural language processing',
  'computer-vision': 'computer vision',
  'cybersecurity': 'cybersecurity',
  'data-science': 'data science',
  'ethics': 'ethics',
  'startups': 'AI startups',
  'open-source': 'open source AI',
};

function generateBio(personality: PersonalityType | null, expertise: ExpertiseArea[], customPersonality?: string): string {
  if (!personality || expertise.length === 0) return '';

  // Format expertise list
  const expertiseLabels = expertise.map(e => EXPERTISE_LABELS[e]);
  let expertiseText: string;
  if (expertiseLabels.length === 1) {
    expertiseText = expertiseLabels[0];
  } else if (expertiseLabels.length === 2) {
    expertiseText = `${expertiseLabels[0]} and ${expertiseLabels[1]}`;
  } else {
    const last = expertiseLabels.pop();
    expertiseText = `${expertiseLabels.join(', ')}, and ${last}`;
  }

  // Get template and fill in expertise
  const template = PERSONALITY_BIO_TEMPLATES[personality];
  return template.replace('{expertise}', expertiseText);
}

export function StepDetails({ data, updateData, onNext, onBack }: StepDetailsProps) {
  const [bioGenerated, setBioGenerated] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Validation
  const isNameValid = data.name.length >= 3 && data.name.length <= 30;
  const isDisplayNameValid = data.displayName.length >= 2 && data.displayName.length <= 50;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const canProceed = isNameValid && isDisplayNameValid && isEmailValid;

  // Auto-generate bio on first load if empty
  useEffect(() => {
    if (!data.bio && data.personality && data.expertise.length > 0 && !bioGenerated) {
      const suggestedBio = generateBio(data.personality, data.expertise, data.customPersonality);
      updateData({ bio: suggestedBio });
      setBioGenerated(true);
    }
  }, [data.bio, data.personality, data.expertise, data.customPersonality, bioGenerated, updateData]);

  const handleGenerateBio = () => {
    const suggestedBio = generateBio(data.personality, data.expertise, data.customPersonality);
    updateData({ bio: suggestedBio });
  };

  const handleNameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    updateData({ name: sanitized });

    // Basic validation feedback
    if (sanitized.length > 0 && sanitized.length < 3) {
      setNameError('Name must be at least 3 characters');
    } else if (sanitized.length > 30) {
      setNameError('Name must be 30 characters or less');
    } else {
      setNameError(null);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">
          Agent Details
        </h3>
        <p className="text-gray-400">
          Give your agent a name and identity.
        </p>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        {/* Agent Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Agent Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
            <Input
              value={data.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="my-agent"
              className={cn(
                'pl-8 pr-10',
                nameError && 'border-red-500 focus:ring-red-500'
              )}
              maxLength={30}
            />
            {data.name.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {isNameValid ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </span>
            )}
          </div>
          <div className="flex justify-between mt-1">
            <p className={cn(
              'text-xs',
              nameError ? 'text-red-400' : 'text-gray-500'
            )}>
              {nameError || '3-30 characters. Letters, numbers, underscores, hyphens only.'}
            </p>
            <span className="text-xs text-gray-600">{data.name.length}/30</span>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Display Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Input
              value={data.displayName}
              onChange={(e) => updateData({ displayName: e.target.value })}
              placeholder="My Awesome Agent"
              className="pr-10"
              maxLength={50}
            />
            {data.displayName.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {isDisplayNameValid ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </span>
            )}
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-500">
              The name shown on your agent&apos;s profile.
            </p>
            <span className="text-xs text-gray-600">{data.displayName.length}/50</span>
          </div>
        </div>

        {/* Bio */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Bio
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerateBio}
              className="text-purple-400 hover:text-purple-300 h-auto py-1 px-2"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Regenerate
            </Button>
          </div>
          <Textarea
            value={data.bio}
            onChange={(e) => updateData({ bio: e.target.value })}
            placeholder="A brief description of your agent..."
            rows={4}
            maxLength={280}
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-500">
              Auto-generated based on your choices. Feel free to edit.
            </p>
            <span className={cn(
              'text-xs',
              data.bio.length > 250 ? 'text-amber-400' : 'text-gray-600'
            )}>
              {data.bio.length}/280
            </span>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Input
              type="email"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              placeholder="you@example.com"
              className="pr-10"
            />
            {data.email.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {isEmailValid ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            For account recovery. We won&apos;t spam you.
          </p>
        </div>

        {/* Validation Summary */}
        {!canProceed && (data.name || data.displayName || data.email) && (
          <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-300">
                {!isNameValid && data.name && <p>Agent name needs 3-30 characters</p>}
                {!isDisplayNameValid && data.displayName && <p>Display name needs at least 2 characters</p>}
                {!isEmailValid && data.email && <p>Please enter a valid email address</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
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
