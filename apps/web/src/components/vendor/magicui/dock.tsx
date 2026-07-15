"use client";

// Vendor: magicui Dock (https://magicui.design/docs/components/dock) — re-skinned to Ninety tokens.
// Re-skin: `motion/react` → framer-motion; cva dropped (not a dependency — plain class string);
// glass/backdrop-blur chrome → solid bg-surface/95 + border-hairline (cheap on the tick path);
// magnification clamped LOW (≤ 1.15× — no macOS bounce spam); the scale spring derives from m.spring.

import React, { useRef } from "react";
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionProps,
} from "framer-motion";

import { cn } from "@/lib/utils";
import { motion as m } from "@/design/motion";

const DEFAULT_SIZE = 44; // 44px — every icon IS the hit target
const DEFAULT_MAGNIFICATION = 50; // 50/44 ≈ 1.14× — calm, information not entertainment
const DEFAULT_DISTANCE = 120;
const DEFAULT_DISABLEMAGNIFICATION = false;
const MAX_SCALE = 1.15; // law: magnification never exceeds 1.15×

const dockClasses =
  "mx-auto flex w-max items-end justify-center gap-1 rounded-card border border-hairline bg-surface/95 p-1.5";

export interface DockProps {
  className?: string;
  iconSize?: number;
  iconMagnification?: number;
  disableMagnification?: boolean;
  iconDistance?: number;
  children: React.ReactNode;
}

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      iconSize = DEFAULT_SIZE,
      iconMagnification = DEFAULT_MAGNIFICATION,
      disableMagnification = DEFAULT_DISABLEMAGNIFICATION,
      iconDistance = DEFAULT_DISTANCE,
      ...props
    },
    ref
  ) => {
    const mouseX = useMotionValue(Infinity);

    const renderChildren = () => {
      return React.Children.map(children, (child) => {
        if (React.isValidElement<DockIconProps>(child) && child.type === DockIcon) {
          return React.cloneElement(child, {
            ...child.props,
            mouseX: mouseX,
            size: iconSize,
            magnification: iconMagnification,
            disableMagnification: disableMagnification,
            distance: iconDistance,
          });
        }
        return child;
      });
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        {...props}
        className={cn(dockClasses, className)}
      >
        {renderChildren()}
      </motion.div>
    );
  }
);

Dock.displayName = "Dock";

export interface DockIconProps
  extends Omit<MotionProps & React.HTMLAttributes<HTMLDivElement>, "children"> {
  size?: number;
  magnification?: number;
  disableMagnification?: boolean;
  distance?: number;
  mouseX?: MotionValue<number>;
  className?: string;
  children?: React.ReactNode;
}

const DockIcon = ({
  size = DEFAULT_SIZE,
  magnification = DEFAULT_MAGNIFICATION,
  disableMagnification,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  ...props
}: DockIconProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const defaultMouseX = useMotionValue(Infinity);

  const distanceCalc = useTransform(mouseX ?? defaultMouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Clamp to the low-magnification law even if a caller passes something louder.
  const targetSize = disableMagnification ? size : Math.min(magnification, size * MAX_SCALE);

  const sizeTransform = useTransform(distanceCalc, [-distance, 0, distance], [size, targetSize, size]);

  // useSpring takes ms; m.spring speaks seconds — same token, converted once.
  const scaleSize = useSpring(sizeTransform, {
    duration: m.spring.duration * 1000,
    bounce: m.spring.bounce,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width: scaleSize, height: scaleSize }}
      className={cn("relative flex aspect-square items-center justify-center rounded-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

DockIcon.displayName = "DockIcon";

export { Dock, DockIcon };
