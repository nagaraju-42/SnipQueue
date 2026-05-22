'use client';

import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  isLoading?: boolean;
  error?: string;
  onResend?: () => void;
  resendCooldown?: number;
}

export function OtpInput({
  length = 6,
  onComplete,
  isLoading = false,
  error,
  onResend,
  resendCooldown = 60,
}: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [countdown, setCountdown] = useState(resendCooldown);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    // Auto-focus next
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    const otp = newDigits.join('');
    if (otp.length === length && !newDigits.includes('')) {
      onComplete(otp);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted.length === 0) return;

    const newDigits = [...digits];
    pasted.split('').forEach((char, i) => {
      newDigits[i] = char;
    });
    setDigits(newDigits);

    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();

    if (pasted.length === length) {
      onComplete(pasted);
    }
  }

  function handleResend() {
    setCountdown(resendCooldown);
    setDigits(Array(length).fill(''));
    inputRefs.current[0]?.focus();
    onResend?.();
  }

  return (
    <div className="space-y-6">
      {/* OTP boxes */}
      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-heading font-bold rounded-xl border-2 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              error
                ? 'border-red-400 text-red-600'
                : digit
                  ? 'border-primary text-warm-800'
                  : 'border-warm-300 text-warm-800 hover:border-warm-400'
            }`}
            disabled={isLoading}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-red-500 font-body">{error}</p>
      )}

      {/* Resend */}
      {onResend && (
        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-sm text-warm-500 font-body">
              Resend code in <span className="font-semibold text-warm-700">{countdown}s</span>
            </p>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleResend}>
              Resend Code
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
