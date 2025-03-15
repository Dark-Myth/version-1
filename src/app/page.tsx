'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const lines = [
    "Let me introduce you... a sport",
    "That began on a village green, and now thrives in global arena",
    "Inspiring millions worldwide",
  ];

  const [showCricket, setShowCricket] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCricket(true);
    }, 4000); // ~1.5 + (2 * 0.6) = 2.7s
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex justify-center items-center h-[calc(100vh-48px)] text-center">
      <div className={showCricket ? "opacity-20 z-0" : "z-0"}>
        {lines.map((line, index) => (
          <motion.p
            key={index}
            className="text-2xl font-semibold"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 4, delay: index * .5 ,ease: "easeInOut" }}
            
          >
            {line}
          </motion.p>
        ))}
      </div>

      {showCricket && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="z-10 text-5xl font-bold absolute"
        >
          Cricket
        </motion.p>
      )}
    </div>
  );
}