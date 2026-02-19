'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepPersonality } from './step-personality';
import { StepExpertise } from './step-expertise';
import { StepDetails } from './step-details';
import { StepPreview } from './step-preview';

export type PersonalityType = 'researcher' | 'builder' | 'philosopher' | 'curator' | 'contrarian' | 'analyst' | 'educator' | 'ethicist' | 'connector' | 'guardian' | 'creative' | 'custom';
export type ExpertiseArea =
  | 'ai-safety'
  | 'ml-engineering'
  | 'philosophy-of-mind'
  | 'ai-policy'
  | 'robotics'
  | 'nlp'
  | 'computer-vision'
  | 'cybersecurity'
  | 'data-science'
  | 'ethics'
  | 'startups'
  | 'open-source';

export interface WizardData {
  personality: PersonalityType | null;
  customPersonality?: string;
  expertise: ExpertiseArea[];
  name: string;
  displayName: string;
  bio: string;
  email: string;
}

const STEPS = [
  { id: 1, name: 'Personality', description: 'Choose your style' },
  { id: 2, name: 'Expertise', description: 'Pick your domains' },
  { id: 3, name: 'Details', description: 'Name your agent' },
  { id: 4, name: 'Launch', description: 'Review and create' },
];

export function CreateWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    personality: null,
    expertise: [],
    name: '',
    displayName: '',
    bio: '',
    email: '',
  });

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    // Only allow going back to previous steps, not forward
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Progress Steps */}
      <div className="border-b border-gray-800 p-6">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <li key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  disabled={step.id > currentStep}
                  className={cn(
                    'group flex flex-col items-center',
                    step.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
                  )}
                >
                  <span
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      step.id === currentStep
                        ? 'bg-purple-600 text-white'
                        : step.id < currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-500'
                    )}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </span>
                  <span
                    className={cn(
                      'mt-2 text-sm font-medium',
                      step.id === currentStep
                        ? 'text-purple-400'
                        : step.id < currentStep
                        ? 'text-green-400'
                        : 'text-gray-500'
                    )}
                  >
                    {step.name}
                  </span>
                  <span className="text-xs text-gray-600 hidden sm:block">
                    {step.description}
                  </span>
                </button>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'hidden sm:block w-16 md:w-24 h-0.5 mx-2',
                      step.id < currentStep ? 'bg-green-600' : 'bg-gray-800'
                    )}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="p-8">
        {currentStep === 1 && (
          <StepPersonality
            data={data}
            updateData={updateData}
            onNext={nextStep}
          />
        )}
        {currentStep === 2 && (
          <StepExpertise
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {currentStep === 3 && (
          <StepDetails
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {currentStep === 4 && (
          <StepPreview
            data={data}
            onBack={prevStep}
          />
        )}
      </div>
    </div>
  );
}
