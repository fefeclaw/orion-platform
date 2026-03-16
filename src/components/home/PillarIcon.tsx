"use client";

import { Anchor, Train, Truck, Plane } from "lucide-react";

interface PillarIconProps {
  icon: string;
  color: string;
  size?: number;
  pillarId?: string;
  hovered?: boolean;
}

const GLOW_CLASSES: Record<string, string> = {
  maritime: "icon-glow-maritime",
  rail:     "icon-glow-rail",
  road:     "icon-glow-road",
  air:      "icon-glow-air",
};

export default function PillarIcon({ icon, color, size = 40, pillarId, hovered }: PillarIconProps) {
  const props = { size, color, strokeWidth: 1.5, "aria-hidden": true };
  const icons: Record<string, React.ReactNode> = {
    anchor: <Anchor {...props} />,
    train:  <Train {...props} />,
    truck:  <Truck {...props} />,
    plane:  <Plane {...props} />,
  };

  const glowClass = pillarId ? GLOW_CLASSES[pillarId] : "";
  const transition = "transition-all duration-500";

  return (
    <div
      className={`flex items-center justify-center ${transition} ${hovered ? glowClass : ""}`}
    >
      {icons[icon]}
    </div>
  );
}
