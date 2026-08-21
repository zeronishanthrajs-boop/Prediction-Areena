'use client';

import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackName?: string;
  iconClassName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = 'User',
  className = '',
  fallbackName = '',
  iconClassName = 'w-1/2 h-1/2',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const hasValidSrc = Boolean(src && typeof src === 'string' && src.trim() !== '' && !imgError);

  if (hasValidSrc) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src!}
        alt={alt}
        className={`object-cover ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  const trimmedFallback = fallbackName.trim();
  const initials = trimmedFallback
    ? trimmedFallback.slice(0, 2).toUpperCase()
    : alt && alt !== 'User' && alt !== 'Avatar' && alt !== ''
    ? alt.trim().slice(0, 2).toUpperCase()
    : null;

  return (
    <div
      className={`flex items-center justify-center bg-[#131926] text-cyan-400 select-none overflow-hidden ${className}`}
      title={alt}
    >
      {initials ? (
        <span className="font-mono font-black text-xs sm:text-sm tracking-tight text-cyan-300">
          {initials}
        </span>
      ) : (
        <UserIcon className={`${iconClassName} text-slate-400`} />
      )}
    </div>
  );
};
