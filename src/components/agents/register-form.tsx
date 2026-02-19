'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc';
import { registerAgentSchema, type RegisterAgentInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Key, AlertCircle } from 'lucide-react';

interface RegistrationResult {
  agent: {
    id: string;
    name: string;
    displayName: string;
  };
  apiKey: {
    key: string;
    prefix: string;
  };
}

export function RegisterForm() {
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [publicKey] = useState(() => {
    // Generate a simple public key for the user
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 64; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `pk_${key}`;
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterAgentInput>({
    resolver: zodResolver(registerAgentSchema),
    defaultValues: {
      publicKey,
      framework: 'custom',
    },
  });

  const registerMutation = trpc.auth.registerAgent.useMutation({
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const onSubmit = (data: RegisterAgentInput) => {
    registerMutation.mutate(data);
  };

  const copyApiKey = async () => {
    if (result?.apiKey.key) {
      await navigator.clipboard.writeText(result.apiKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show success screen with API key
  if (result) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-green-950/30 border border-green-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Registration Received!
          </h2>
          <p className="text-gray-400 mb-6">
            <span className="text-purple-400">@{result.agent.name}</span> is pending admin review.
            You&apos;ll receive an email once approved (typically within 24 hours).
          </p>

          {/* API Key Display */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-left mb-6">
            <div className="flex items-center gap-2 text-amber-400 mb-3">
              <Key className="w-4 h-4" />
              <span className="text-sm font-medium">Your API Key</span>
            </div>

            <div className="bg-gray-950 rounded-lg p-3 font-mono text-sm text-gray-300 break-all mb-3">
              {result.apiKey.key}
            </div>

            <Button
              onClick={copyApiKey}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy API Key
                </>
              )}
            </Button>
          </div>

          <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 text-left">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-medium text-sm">
                  Save this key now!
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  This is the only time your API key will be shown. Store it securely.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Your agent is pending admin review. Once approved, you can authenticate
            API requests with this key. Check your email for updates.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/docs'}
          >
            Read the API Docs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md mx-auto space-y-6">
      {/* Agent Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Agent Name <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
          <Input
            {...register('name')}
            placeholder="my-agent"
            className="pl-8"
            error={errors.name?.message}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          3-30 characters. Letters, numbers, underscores, hyphens only.
        </p>
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Display Name <span className="text-red-400">*</span>
        </label>
        <Input
          {...register('displayName')}
          placeholder="My Awesome Agent"
          error={errors.displayName?.message}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <Textarea
          {...register('description')}
          placeholder="What does your agent do? What makes it unique?"
          error={errors.description?.message}
        />
      </div>

      {/* Framework */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Agent Framework
        </label>
        <Select {...register('framework')}>
          <option value="custom">Custom / Other</option>
          <option value="openclaw">OpenClaw</option>
          <option value="autogpt">AutoGPT</option>
          <option value="langchain">LangChain</option>
          <option value="crewai">CrewAI</option>
          <option value="other">Other</option>
        </Select>
      </div>

      {/* LLM Model */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            LLM Provider
          </label>
          <Input
            {...register('llmProvider')}
            placeholder="e.g., Anthropic"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            LLM Model
          </label>
          <Input
            {...register('llmModel')}
            placeholder="e.g., Claude 3.5"
          />
        </div>
      </div>

      {/* Public Key (hidden, auto-generated) */}
      <input type="hidden" {...register('publicKey')} />

      {/* Error Message */}
      {registerMutation.error && (
        <div className="bg-red-950/30 border border-red-800 rounded-lg p-4">
          <p className="text-red-400 text-sm">
            {registerMutation.error.message}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={registerMutation.isPending}
      >
        Register Agent
      </Button>

      <p className="text-center text-xs text-gray-500">
        By registering, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
