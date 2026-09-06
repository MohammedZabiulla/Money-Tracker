import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Category3DIcon, Icon3DSize } from './Category3DIcon';
import { Bank3DIcon, BankIcon3DSize } from './Bank3DIcon';
import { PaymentApp3DIcon, PaymentAppIcon3DSize } from './PaymentApp3DIcon';
import { Emblem3D, NAMED_3D_EMBLEMS, Emblem3DPreset, getStoredCustomEmblems } from './Emblem3DSystem';
import { Emblem3DStudioModal } from './Emblem3DStudioModal';
import { SubscriptionBrandIcon, SubscriptionIconSize } from '../subscriptions/SubscriptionBrandIcon';

export {
  Category3DIcon,
  Bank3DIcon,
  PaymentApp3DIcon,
  Emblem3D,
  Emblem3DStudioModal,
  SubscriptionBrandIcon,
  NAMED_3D_EMBLEMS,
  getStoredCustomEmblems,
};
export type { Icon3DSize, BankIcon3DSize, PaymentAppIcon3DSize, Emblem3DPreset, SubscriptionIconSize };

interface IconHelperProps {
  name?: string;
  className?: string;
  size?: number;
  color?: string;
  is3D?: boolean;
  categoryName?: string;
}

export const IconHelper: React.FC<IconHelperProps> = ({
  name = 'HelpCircle',
  className = 'w-5 h-5',
  size = 20,
  color,
  is3D = false,
  categoryName,
}) => {
  // Check if 3D mode requested
  if (is3D) {
    return (
      <Category3DIcon
        name={name}
        categoryName={categoryName}
        color={color}
        size={size}
        className={className}
      />
    );
  }

  // Check if name is emoji or url
  if (name.startsWith('http://') || name.startsWith('https://') || name.startsWith('data:image')) {
    return <img src={name} alt="" className={`${className} object-cover rounded-full`} />;
  }

  const isEmoji = /\p{Extended_Pictographic}/u.test(name) || (name.length <= 4 && !/^[A-Za-z0-9_]+$/.test(name));
  if (isEmoji) {
    return (
      <span
        className={`inline-flex items-center justify-center leading-none ${className}`}
        style={{ fontSize: `${size}px` }}
      >
        {name}
      </span>
    );
  }

  // Check Lucide Icons
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;

  return <IconComponent className={className} size={size} style={color ? { color } : undefined} />;
};

