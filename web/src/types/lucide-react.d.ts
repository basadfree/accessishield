declare module 'lucide-react' {
  import { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';
  
  export interface LucideIconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    strokeWidth?: number | string;
    color?: string;
    absoluteStrokeWidth?: boolean;
  }
  
  export type LucideIcon = ForwardRefExoticComponent<LucideIconProps & RefAttributes<SVGSVGElement>>;
  
  export const Loader2: LucideIcon;
  export const CreditCard: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Lock: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Zap: LucideIcon;
  export const Eye: LucideIcon;
  export const Code: LucideIcon;
  export const FileText: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Check: LucideIcon;
  export const MousePointer: LucideIcon;
  export const Search: LucideIcon;
  export const Shield: LucideIcon;
  export const Download: LucideIcon;
  export const Copy: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Twitter: LucideIcon;
  export const Github: LucideIcon;
  export const Linkedin: LucideIcon;
  export const ShieldCheck: LucideIcon;
  
  // Allow any other icon
  const icons: { [key: string]: LucideIcon };
  export default icons;
}