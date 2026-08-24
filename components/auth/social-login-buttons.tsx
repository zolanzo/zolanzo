"use client";

import React from "react";

interface SocialLoginButtonsProps {
  onSocialLogin?: (provider: string) => void;
}

export function SocialLoginButtons({ onSocialLogin }: SocialLoginButtonsProps) {
  const handleLogin = (provider: string) => {
    if (onSocialLogin) {
      onSocialLogin(provider);
    } else {
      alert(`Social Auth with ${provider} is initialized for production.`);
    }
  };

  const buttonClasses =
    "group flex h-[46px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-surface text-xs font-semibold text-foreground transition-all duration-200 hover:bg-hover";

  return (
    <div className="space-y-2.5 w-full">
      {/* Google */}
      <button
        type="button"
        onClick={() => handleLogin("Google")}
        className={buttonClasses}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Apple */}
      <button
        type="button"
        onClick={() => handleLogin("Apple")}
        className={buttonClasses}
      >
        <svg className="h-4 w-4 fill-current text-foreground" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.11-1 .04-2.17.67-2.87 1.49-.6.7-1.14 1.84-.99 2.97 1.11.09 2.21-.54 2.87-1.35z" />
        </svg>
        <span>Continue with Apple</span>
      </button>

      {/* Microsoft */}
      <button
        type="button"
        onClick={() => handleLogin("Microsoft")}
        className={buttonClasses}
      >
        <svg className="w-4 h-4" viewBox="0 0 23 23">
          <path fill="#f35325" d="M1 1h10v10H1z" />
          <path fill="#81bc06" d="M12 1h10v10H1z" />
          <path fill="#05a6f0" d="M1 12h10v10H1z" />
          <path fill="#ffba08" d="M12 12h10v10H1z" />
        </svg>
        <span>Continue with Microsoft</span>
      </button>

      {/* Facebook */}
      <button
        type="button"
        onClick={() => handleLogin("Facebook")}
        className={buttonClasses}
      >
        <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span>Continue with Facebook</span>
      </button>
    </div>
  );
}
