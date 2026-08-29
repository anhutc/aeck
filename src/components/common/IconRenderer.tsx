import React from 'react';
import {
  Wallet,
  ShieldCheck,
  Plane,
  BookOpen,
  Users,
  Gift,
  PartyPopper,
  TrendingUp,
  PlusCircle,
  Utensils,
  Calendar,
  ShoppingBag,
  Building,
  HeartHandshake,
  FileText,
  MinusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  Coffee,
  HelpCircle,
  LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Wallet,
  ShieldCheck,
  Plane,
  BookOpen,
  Users,
  Gift,
  PartyPopper,
  TrendingUp,
  PlusCircle,
  Utensils,
  Calendar,
  ShoppingBag,
  Building,
  HeartHandshake,
  FileText,
  MinusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  Coffee,
};

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5', size }) => {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent className={className} size={size} />;
};
