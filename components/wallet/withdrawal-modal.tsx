"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Building01Icon,
} from "@hugeicons/core-free-icons";
import { PINInput } from "@/components/auth/pin-input";
import { ValidationMessage } from "@/components/auth/validation-message";
import { zolanzoEngine } from "@/lib/engine/business-engine";

interface WithdrawalModalProps {
  isOpen: boolean;
  availableBalance?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function WithdrawalModal({
  isOpen,
  availableBalance = "₦0",
  onClose,
  onSuccess,
}: WithdrawalModalProps) {
  const [step, setStep] = useState<"amount" | "bank" | "pin" | "success">("amount");
  const [amount, setAmount] = useState("5000");
  const [bank] = useState("Primary Linked Bank Account");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleProceedToBank = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount < 1000) {
      setError("Minimum withdrawal amount is ₦1,000.");
      return;
    }

    setStep("bank");
  };

  const handleProceedToPin = () => {
    setStep("pin");
  };

  const handleConfirmWithdrawal = async () => {
    setError("");

    if (pin.length !== 6) {
      setError("Please enter your 6-digit security PIN.");
      return;
    }

    setLoading(true);

    try {
      await zolanzoEngine.processBankWithdrawal(
        "WORKER_100",
        parseInt(amount, 10),
        "GTBank",
        "012****890"
      );
      setLoading(false);
      setStep("success");
    } catch (err: unknown) {
      setLoading(false);
      setError((err as Error).message || "Withdrawal failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[420px] bg-[#0A0F12] border border-white/10 rounded-3xl p-6 shadow-2xl relative text-white">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <ValidationMessage message={error} />

        {/* STEP 1: AMOUNT */}
        {step === "amount" && (
          <form onSubmit={handleProceedToBank} className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <HugeiconsIcon icon={Wallet01Icon} size={24} />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Withdraw Funds</h3>
              <p className="text-xs text-zinc-400">Available Balance: <strong className="text-emerald-400 font-bold">{availableBalance}</strong></p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-300">Enter Amount (₦)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="18400"
                className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] text-white text-base font-bold font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Select Bank Account</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: SELECT BANK */}
        {step === "bank" && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold tracking-tight">Select Payout Destination</h3>
              <p className="text-xs text-zinc-400">Amount: <strong className="text-white">₦{parseInt(amount, 10).toLocaleString()}</strong></p>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold text-zinc-300">Verified Bank Account</label>
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Building01Icon} size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">{bank}</p>
                  <p className="text-[10px] text-emerald-400">Instant Disbursement Enabled</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPin}
              className="w-full h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Confirm & Enter PIN</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>
        )}

        {/* STEP 3: ENTER PIN */}
        {step === "pin" && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold tracking-tight">Authorize Withdrawal</h3>
              <p className="text-xs text-zinc-400">Enter your 6-digit security PIN to disburse ₦{parseInt(amount, 10).toLocaleString()}</p>
            </div>

            <PINInput
              id="withdrawalPin"
              label="6-Digit Security PIN"
              value={pin}
              onChange={setPin}
            />

            <button
              type="button"
              onClick={handleConfirmWithdrawal}
              disabled={loading || pin.length !== 6}
              className="w-full h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Disburse ₦{parseInt(amount, 10).toLocaleString()} Now</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "success" && (
          <div className="text-center space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={36} />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold tracking-tight">Withdrawal Initiated</h3>
              <p className="text-xs text-zinc-400">
                ₦{parseInt(amount, 10).toLocaleString()} is being transferred to <strong className="text-white">{bank}</strong>.
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold pt-1">Estimated delivery: 2 - 10 minutes</p>
            </div>

            <button
              type="button"
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center cursor-pointer shadow-md"
            >
              Back to Wallet
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
