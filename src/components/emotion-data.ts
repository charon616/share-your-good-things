import lookTop from '../assets/look-top.svg';
import lookTopFill from '../assets/look-top-fill.svg';
import handPrayer from '../assets/hand-prayer.svg';
import handPrayerFill from '../assets/hand-prayer-fill.svg';
import plant04 from '../assets/plant-04.svg';
import plant04Fill from '../assets/plant-04-fill.svg';

export type EmotionType = "happy" | "grateful" | "peaceful";

export const emotionData: Record<EmotionType, { label: string; icon: string; iconFill: string; bgClassName: string }> = {
  happy: {
    label: "Happy",
    icon: lookTop,
    iconFill: lookTopFill,
    bgClassName: "bg-accent-yellow",
  },
  grateful: {
    label: "Grateful",
    icon: handPrayer,
    iconFill: handPrayerFill,
    bgClassName: "bg-accent-purple",
  },
  peaceful: {
    label: "Calm",
    icon: plant04,
    iconFill: plant04Fill,
    bgClassName: "bg-accent-green",
  },
};
