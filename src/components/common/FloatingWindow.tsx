/**
 * @file FloatingWindow.tsx
 * @description A draggable and resizable floating window container.
 * @module src/components/common
 */

"use client";

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { X } from "lucide-react";

type Point = { x: number; y: number };
type WindowSize = { width: number; height: number };
type ResizeDirection = "n" | "e" | "s" | "w" | "ne" | "nw" | "se" | "sw";

interface FloatingWindowProps {
    id: string;
    title: string;
    children: React.ReactNode;
    initialPosition?: Point;
    initialSize?: WindowSize;
    onClose: () => void;
    onUpdate?: (updates: { position?: Point; size?: WindowSize }) => void;
    minWidth?: number;
    minHeight?: number;
}

interface InteractionState {
    mode: "drag" | "resize";
    direction?: ResizeDirection;
    startPointer: Point;
    startPosition: Point;
    startSize: WindowSize;
}

const VIEWPORT_GUTTER = 8;
const RESIZE_HANDLES: Array<{ direction: ResizeDirection; style: React.CSSProperties }> = [
    { direction: "n", style: { top: -4, left: 12, right: 12, height: 8, cursor: "ns-resize" } },
    { direction: "e", style: { top: 12, right: -4, bottom: 12, width: 8, cursor: "ew-resize" } },
    { direction: "s", style: { left: 12, right: 12, bottom: -4, height: 8, cursor: "ns-resize" } },
    { direction: "w", style: { top: 12, left: -4, bottom: 12, width: 8, cursor: "ew-resize" } },
    { direction: "ne", style: { top: -6, right: -6, width: 16, height: 16, cursor: "nesw-resize" } },
    { direction: "nw", style: { top: -6, left: -6, width: 16, height: 16, cursor: "nwse-resize" } },
    { direction: "se", style: { right: -6, bottom: -6, width: 22, height: 22, cursor: "nwse-resize" } },
    { direction: "sw", style: { left: -6, bottom: -6, width: 16, height: 16, cursor: "nesw-resize" } },
];

function viewportSize(): WindowSize {
    if (typeof window === "undefined") return { width: 1280, height: 720 };
    return { width: window.innerWidth, height: window.innerHeight };
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), Math.max(min, max));
}

function clampSize(size: WindowSize, minWidth: number, minHeight: number): WindowSize {
    const viewport = viewportSize();
    return {
        width: clamp(size.width, minWidth, viewport.width - VIEWPORT_GUTTER * 2),
        height: clamp(size.height, minHeight, viewport.height - VIEWPORT_GUTTER * 2),
    };
}

function clampPosition(position: Point, size: WindowSize): Point {
    const viewport = viewportSize();
    return {
        x: clamp(position.x, VIEWPORT_GUTTER, viewport.width - size.width - VIEWPORT_GUTTER),
        y: clamp(position.y, VIEWPORT_GUTTER, viewport.height - size.height - VIEWPORT_GUTTER),
    };
}

function resizeFromInteraction(
    direction: ResizeDirection,
    interaction: InteractionState,
    pointer: Point,
    minWidth: number,
    minHeight: number,
): { position: Point; size: WindowSize } {
    const dx = pointer.x - interaction.startPointer.x;
    const dy = pointer.y - interaction.startPointer.y;
    const nextPosition = { ...interaction.startPosition };
    const nextSize = { ...interaction.startSize };

    if (direction.includes("e")) nextSize.width = interaction.startSize.width + dx;
    if (direction.includes("s")) nextSize.height = interaction.startSize.height + dy;
    if (direction.includes("w")) {
        nextSize.width = interaction.startSize.width - dx;
        nextPosition.x = interaction.startPosition.x + dx;
    }
    if (direction.includes("n")) {
        nextSize.height = interaction.startSize.height - dy;
        nextPosition.y = interaction.startPosition.y + dy;
    }

    if (nextSize.width < minWidth) {
        if (direction.includes("w")) nextPosition.x -= minWidth - nextSize.width;
        nextSize.width = minWidth;
    }
    if (nextSize.height < minHeight) {
        if (direction.includes("n")) nextPosition.y -= minHeight - nextSize.height;
        nextSize.height = minHeight;
    }

    const viewport = viewportSize();
    if (nextPosition.x < VIEWPORT_GUTTER) {
        nextSize.width -= VIEWPORT_GUTTER - nextPosition.x;
        nextPosition.x = VIEWPORT_GUTTER;
    }
    if (nextPosition.y < VIEWPORT_GUTTER) {
        nextSize.height -= VIEWPORT_GUTTER - nextPosition.y;
        nextPosition.y = VIEWPORT_GUTTER;
    }

    nextSize.width = Math.min(nextSize.width, viewport.width - nextPosition.x - VIEWPORT_GUTTER);
    nextSize.height = Math.min(nextSize.height, viewport.height - nextPosition.y - VIEWPORT_GUTTER);

    return {
        position: clampPosition(nextPosition, nextSize),
        size: clampSize(nextSize, minWidth, minHeight),
    };
}

export const FloatingWindow: React.FC<FloatingWindowProps> = ({
    id,
    title,
    children,
    initialPosition = { x: 100, y: 100 },
    initialSize = { width: 400, height: 300 },
    onClose,
    onUpdate,
    minWidth = 300,
    minHeight = 200,
}) => {
    const [position, setPosition] = useState(() => clampPosition(initialPosition, clampSize(initialSize, minWidth, minHeight)));
    const [size, setSize] = useState(() => clampSize(initialSize, minWidth, minHeight));
    const [isInteracting, setIsInteracting] = useState(false);
    const interactionRef = useRef<InteractionState | null>(null);
    const positionRef = useRef(position);
    const sizeRef = useRef(size);

    useEffect(() => { positionRef.current = position; }, [position]);
    useEffect(() => { sizeRef.current = size; }, [size]);

    const finishInteraction = useCallback(() => {
        if (!interactionRef.current) return;
        interactionRef.current = null;
        setIsInteracting(false);
        onUpdate?.({ position: positionRef.current, size: sizeRef.current });
    }, [onUpdate]);

    const handlePointerMove = useCallback((event: PointerEvent) => {
        const interaction = interactionRef.current;
        if (!interaction) return;

        const pointer = { x: event.clientX, y: event.clientY };
        if (interaction.mode === "drag") {
            const nextPosition = clampPosition({
                x: interaction.startPosition.x + pointer.x - interaction.startPointer.x,
                y: interaction.startPosition.y + pointer.y - interaction.startPointer.y,
            }, sizeRef.current);
            setPosition(nextPosition);
            return;
        }

        if (!interaction.direction) return;
        const next = resizeFromInteraction(
            interaction.direction,
            interaction,
            pointer,
            minWidth,
            minHeight,
        );
        setPosition(next.position);
        setSize(next.size);
    }, [minHeight, minWidth]);

    useEffect(() => {
        if (!isInteracting) return undefined;

        const previousUserSelect = document.body.style.userSelect;
        document.body.style.userSelect = "none";
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", finishInteraction);
        window.addEventListener("pointercancel", finishInteraction);

        return () => {
            document.body.style.userSelect = previousUserSelect;
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", finishInteraction);
            window.removeEventListener("pointercancel", finishInteraction);
        };
    }, [finishInteraction, handlePointerMove, isInteracting]);

    useEffect(() => {
        const handleViewportResize = () => {
            const nextSize = clampSize(sizeRef.current, minWidth, minHeight);
            setSize(nextSize);
            setPosition(clampPosition(positionRef.current, nextSize));
        };
        window.addEventListener("resize", handleViewportResize);
        return () => window.removeEventListener("resize", handleViewportResize);
    }, [minHeight, minWidth]);

    const beginInteraction = (
        event: React.PointerEvent,
        mode: InteractionState["mode"],
        direction?: ResizeDirection,
    ) => {
        if (mode === "drag" && (event.target as HTMLElement).closest(".window-controls")) return;
        event.preventDefault();
        event.stopPropagation();
        interactionRef.current = {
            mode,
            direction,
            startPointer: { x: event.clientX, y: event.clientY },
            startPosition: positionRef.current,
            startSize: sizeRef.current,
        };
        setIsInteracting(true);
    };

    return (
      <div
        data-floating-window-id={id}
        style={{ position: "fixed", left: position.x, top: position.y, width: size.width, height: size.height, zIndex: isInteracting ? 1301 : 1300, display: "flex", flexDirection: "column", backgroundColor: "rgba(10, 10, 10, 0.85)", backdropFilter: "blur(12px)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.15)", boxShadow: isInteracting ? "0 24px 60px rgba(0, 0, 0, 0.55)" : "0 20px 40px rgba(0, 0, 0, 0.4)", overflow: "hidden", color: "white", touchAction: "none" }}
      >
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 34, padding: "8px 12px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", cursor: isInteracting ? "grabbing" : "grab", userSelect: "none", touchAction: "none" }}
          onPointerDown={(event) => beginInteraction(event, "drag")}
        >
          <span style={{ minWidth: 0, fontSize: "12px", fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </span>

          <div className="window-controls" style={{ display: "flex", gap: "8px", flex: "0 0 auto" }}>
            <button
              type="button"
              aria-label={`Close ${title}`}
              onClick={onClose}
              style={{ background: "none", border: "none", color: "rgba(255, 255, 255, 0.55)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px" }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, position: "relative", overflow: "hidden", pointerEvents: isInteracting ? "none" : "auto" }}>
          {children}
        </div>

        {RESIZE_HANDLES.map(({ direction, style }) => (
          <div
            key={direction}
            aria-label={`Resize ${title} ${direction}`}
            role="separator"
            style={{ position: "absolute", zIndex: 1302, touchAction: "none", ...style }}
            onPointerDown={(event) => beginInteraction(event, "resize", direction)}
          />
        ))}

        <div
          aria-hidden="true"
          style={{ position: "absolute", right: 5, bottom: 5, width: 9, height: 9, borderRight: "2px solid rgba(255, 255, 255, 0.32)", borderBottom: "2px solid rgba(255, 255, 255, 0.32)", pointerEvents: "none" }}
        />
      </div>
    );
};
