'use client';

import React, { useRef, useEffect } from 'react';
import { MarketTick, MarketRound } from '@/lib/types';

interface MarketChartProps {
  ticks: MarketTick[];
  currentPrice: number;
  activeRound: MarketRound | null;
  userEntryPrice?: number | null;
  userDirection?: 'UP' | 'DOWN' | null;
}

export const MarketChart: React.FC<MarketChartProps> = ({
  ticks,
  currentPrice,
  activeRound,
  userEntryPrice,
  userDirection,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    if (ticks.length < 2) return;

    // Determine min/max for dynamic scaling
    const prices = ticks.map((t) => t.price);
    if (userEntryPrice) prices.push(userEntryPrice);
    if (activeRound?.start_price) prices.push(activeRound.start_price);

    let minPrice = Math.min(...prices);
    let maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    // Add 15% vertical padding
    minPrice -= range * 0.15;
    maxPrice += range * 0.15;
    const finalRange = maxPrice - minPrice;

    const getY = (price: number) => {
      return height - ((price - minPrice) / finalRange) * (height - 40) - 20;
    };

    const getX = (index: number) => {
      return (index / (ticks.length - 1)) * (width - 70); // Leave 70px for right price axis
    };

    // Determine chart theme (bullish/bearish relative to round start)
    const isBullish = activeRound ? currentPrice >= activeRound.start_price : true;
    const strokeColor = isBullish ? '#00e676' : '#ff3366';
    const gradientTop = isBullish ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 51, 102, 0.25)';

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Draw Subtle Grid Lines & Y-Axis Labels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const p = minPrice + (finalRange / gridLines) * i;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 65, y);
      ctx.stroke();

      ctx.fillText(p.toFixed(2), width - 60, y + 3);
    }

    // Draw Round Start Price line (Reference Line)
    if (activeRound?.start_price) {
      const startY = getY(activeRound.start_price);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, startY);
      ctx.lineTo(width - 65, startY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Badge on right
      ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.fillRect(width - 62, startY - 8, 58, 16);
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`BASE: ${activeRound.start_price.toFixed(1)}`, width - 60, startY + 4);
    }

    // Draw User Entry Price Line if in active bet
    if (userEntryPrice) {
      const entryY = getY(userEntryPrice);
      const isWinning = userDirection === 'UP' ? currentPrice >= userEntryPrice : currentPrice <= userEntryPrice;
      const betColor = isWinning ? '#00e676' : '#ff3366';

      ctx.strokeStyle = betColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(width - 65, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = betColor;
      ctx.fillRect(width - 62, entryY - 9, 58, 18);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`YOU: ${userDirection}`, width - 58, entryY + 4);
    }

    // Draw Gradient Area under Price Line
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, gradientTop);
    gradient.addColorStop(1, 'rgba(7, 9, 14, 0.0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), height);
    ticks.forEach((tick, i) => {
      ctx.lineTo(getX(i), getY(tick.price));
    });
    ctx.lineTo(getX(ticks.length - 1), height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Main Line
    ctx.beginPath();
    ticks.forEach((tick, i) => {
      const x = getX(i);
      const y = getY(tick.price);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Draw Leading Current Price Pulse Point
    const lastX = getX(ticks.length - 1);
    const lastY = getY(currentPrice);

    // Outer pulsating ring
    ctx.beginPath();
    ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
    ctx.fillStyle = isBullish ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 51, 102, 0.25)';
    ctx.fill();

    // Inner bright dot
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Live price marker tag on axis
    ctx.fillStyle = strokeColor;
    ctx.fillRect(width - 62, lastY - 10, 58, 20);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(currentPrice.toFixed(2), width - 58, lastY + 4);

  }, [ticks, currentPrice, activeRound, userEntryPrice, userDirection]);

  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
