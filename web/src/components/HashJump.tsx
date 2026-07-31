"use client";
// Deep links: shannon.engineeringcommunity.net/#p-38 lands centered on the
// plate with a flash, same as the original page's load handler.
import { useEffect } from "react";
import { useReducedMotion } from "motion/react";
import { jumpToPlate } from "@/lib/jump";

export default function HashJump() {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    if (!el || !el.classList.contains("plate")) return;
    const t = window.setTimeout(() => jumpToPlate(id, !!reduceMotion), 300);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);
  return null;
}
