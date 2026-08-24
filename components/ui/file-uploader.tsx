"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon, Cancel01Icon, File01Icon } from "@hugeicons/core-free-icons";

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
    <div className="w-full space-y-2 text-left">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground">{label}</label>
      )}

      {error && <p className="text-xs font-medium text-danger">{error}</p>}

      {selectedFile ? (
        <div className="space-y-3 rounded-2xl border border-primary/40 bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle font-bold text-primary">
                <HugeiconsIcon icon={File01Icon} size={20} />
              </div>
              <div>
                <p className="max-w-[240px] truncate text-xs font-bold text-foreground">{selectedFile.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                  {uploading ? `Uploading ${progress}%` : "Upload Complete"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!uploading && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  title="Remove File"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              )}
            </div>
          </div>

          {uploading && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-border bg-muted p-8 text-center transition-colors hover:border-primary/50"
        >
          <input
            type="file"
            accept={accept}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <div className="flex flex-col items-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-subtle text-primary transition-transform group-hover:scale-105">
              <HugeiconsIcon icon={Upload01Icon} size={24} />
            </div>
            <p className="text-xs font-bold text-foreground">Click or drag files here to upload</p>
            <p className="text-[10px] text-muted-foreground">
              Supports PNG, JPG, PDF, ZIP (Max {maxSizeMB}MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
