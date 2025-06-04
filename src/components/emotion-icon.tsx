// EmotionIcon: 
// Renders an emotion icon with optional background and label.

import { emotionData, type EmotionType } from "./emotion-data";

export interface EmotionIconProps {
  emotion: EmotionType;
  showLabel?: boolean;
  size?: number;
  fill?: boolean;
  bgClassName?: string;
}

export function EmotionIconWithBackground({ emotion, showLabel = false, size = 20 }: Omit<EmotionIconProps, 'bgClassName' | 'fill'>) {
  const data = emotionData[emotion];
  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-lg p-1.5 flex items-center justify-center ${data.bgClassName} cursor-pointer`}>
        <img src={data.iconFill} alt={data.label} width={size} height={size} />
      </div>
      {showLabel && <span className="text-sm font-medium">{data.label}</span>}
    </div>
  );
}

export default function EmotionIcon({ emotion, showLabel = false, size = 20, fill = false, bgClassName = "" }: EmotionIconProps) {
  const data = emotionData[emotion];
  if (!data) return null;
  const iconSrc = fill ? data.iconFill : data.icon;
  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 flex items-center justify-center ${bgClassName} cursor-pointer`}>
        <img src={iconSrc} alt={data.label} width={size} height={size} />
      </div>
      {showLabel && <span className="text-sm font-medium">{data.label}</span>}
    </div>
  );
}
