"use client";
import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';

const pixelVariants: Variants = {
    initial: { scale: 1 },
    animate: (i: number) => ({
        scale: 0,
        transition: {
            duration: 0.12,
            ease: "anticipate",
            delay: 0.008 * i
        }
    })
}

const SimplifiedGrid = ({ onTransitionComplete }: { onTransitionComplete?: () => void }) => {
    const [isClient, setIsClient] = useState(false);

    const BLOCK_COUNT = 200;  
    const BLOCK_DURATION = 0.12;
    const STAGGER_DELAY = 0.008;

    const maxDelay = (BLOCK_COUNT - 1) * STAGGER_DELAY;
    const totalAnimationTime = BLOCK_DURATION + maxDelay; // ~0.8s

    useEffect(() => {
        setIsClient(true);

        if (onTransitionComplete) {
            const timer = setTimeout(() => {
                onTransitionComplete();
            }, totalAnimationTime * 1000);

            return () => clearTimeout(timer);
        }
    }, [onTransitionComplete, totalAnimationTime]);

    const shuffle = (a: number[]) => {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    if (!isClient) return null;

    const blocks = [...Array(BLOCK_COUNT)].map((_, i) => i);
    const shuffledCookies = shuffle([...blocks]);

    return (
        <div style={{
            position: "fixed",
            zIndex: 9999,
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexWrap: "wrap",
            pointerEvents: "none"
        }}>
            {blocks.map((b, i) => (
                <motion.div
                    key={i}
                    custom={shuffledCookies[i]}
                    variants={pixelVariants}
                    initial="initial"
                    animate="animate"
                    style={{
                        width: "10vw",
                        height: "10vw",
                        backgroundColor: "#8B5CF6"
                    }}
                />
            ))}
        </div>
    );
};

export default function PixelTransition({ onTransitionComplete }: { onTransitionComplete?: () => void }) {
    return <SimplifiedGrid onTransitionComplete={onTransitionComplete} />;
}
