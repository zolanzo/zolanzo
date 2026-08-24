"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Building01Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

interface BankManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBankAdded: (bankName: string, accountNumber: string) => void;
}

export function BankManagerModal({ isOpen, onClose, onBankAdded }: BankManagerModalProps) {
  const [selectedBank, setSelectedBank] = useState("Guaranty Trust Bank (GTBank)");
  const [accountNumber, setAccountNumber] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setAccountNumber(val);

    if (val.length === 10) {
      setVerifying(true);
      setTimeout(() => {
        setVerifying(false);
        setVerifiedName("GRACE ADEBAYO");
      }, 600);
    } else {
      setVerifiedName("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountNumber.length === 10 && verifiedName) {
      onBankAdded(selectedBank, accountNumber);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[440px] bg-card border border-border rounded-3xl p-6 shadow-2xl relative text-foreground space-y-5">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <div className="space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-primary-subtle border border-primary/20 text-primary flex items-center justify-center">
            <HugeiconsIcon icon={Building01Icon} size={24} />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Add Bank Account</h3>
          <p className="text-xs text-muted-foreground">Link a verified Nigerian bank account for instant withdrawals.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Select Bank</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full h-[48px] px-4 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs font-bold focus:outline-none"
            >
              <option>Guaranty Trust Bank (GTBank)</option>
              <option>Zenith Bank</option>
              <option>Access Bank</option>
              <option>First Bank of Nigeria</option>
              <option>Kuda Bank</option>
              <option>Moniepoint Microfinance Bank</option>
              <option>OPay</option>
              <option>PalmPay</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">10-Digit Account Number</label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={handleAccountChange}
              placeholder="0123456789"
              className="w-full h-[48px] px-4 rounded-xl bg-card border border-border focus:border-primary text-foreground text-base font-bold font-mono focus:outline-none"
            />
          </div>

          {verifying && (
            <p className="text-xs text-warning font-medium flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-warning border-t-transparent rounded-full animate-spin" />
              <span>Verifying account name with NIBSS...</span>
            </p>
          )}

          {verifiedName && (
            <div className="p-3.5 rounded-xl bg-primary-subtle border border-primary/30 text-xs flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="text-primary shrink-0" />
              <div>
                <p className="font-bold text-foreground">{verifiedName}</p>
                <p className="text-[10px] text-primary">Account verified with NIBSS</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={accountNumber.length !== 10 || !verifiedName}
            className="w-full h-[48px] rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
          >
            <span>Link Bank Account</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </button>
        </form>

      </div>
    </div>
  );
}
