"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon,
  Cancel01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";

interface FileUploaderProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect?: (file: File | null) => void;
}

export function FileUploader({
  label = "Upload File or Document",
  accept = "image/png, image/jpeg, application/pdf",
  maxSizeMB = 25,
  onFileSelect,
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (file: File) => {
    setError("");
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds maximum limit of ${maxSizeMB}MB.`);
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setProgress(20);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setUploading(false);
          if (onFileSelect) onFileSelect(file);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setProgress(0);
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="space-y-2 text-left w-full">
      {label && <label className="text-xs font-bold text-white uppercase tracking-wider block">{label}</label>}

      {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

      {selectedFile ? (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <HugeiconsIcon icon={File01Icon} size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-white max-w-[240px] truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-zinc-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {uploading ? `Uploading ${progress}%` : "Upload Complete"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!uploading && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove File"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              )}
            </div>
          </div>

          {uploading && (
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-colors bg-zinc-900/40 cursor-pointer group"
        >
          <input
            type="file"
            accept={accept}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <HugeiconsIcon icon={Upload01Icon} size={24} />
            </div>
            <p className="text-xs font-bold text-white">Click or drag files here to upload</p>
            <p className="text-[10px] text-zinc-500">Supports PNG, JPG, PDF, ZIP (Max {maxSizeMB}MB)</p>
          </div>
        </div>
      )}
    </div>
  );
}
