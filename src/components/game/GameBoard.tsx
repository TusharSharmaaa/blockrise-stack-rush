import { useEffect, useRef, useState } from 'react';
import { Block } from '@/types/game';
import { GRID_WIDTH, GRID_HEIGHT } from '@/utils/blockShapes';

interface GameBoardProps {
  grid: (string | null)[][];
  currentBlock: Block | null;
}

const GameBoard = ({ grid, currentBlock }: GameBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(24);

  // Make responsive based on actual container dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const updateSize = () => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const availableWidth = containerRect.width;
      const availableHeight = containerRect.height;
      
      // Skip if dimensions are not valid
      if (availableWidth <= 0 || availableHeight <= 0) return;
      
      // Calculate cell size based on actual available space
      // Account for minimal border (1px on each side)
      const widthWithPadding = Math.max(0, availableWidth - 2);
      const heightWithPadding = Math.max(0, availableHeight - 2);
      
      // Calculate cell size based on both dimensions
      const heightBasedSize = Math.floor(heightWithPadding / GRID_HEIGHT);
      const widthBasedSize = Math.floor(widthWithPadding / GRID_WIDTH);
      
      // Use the smaller dimension to ensure it fits perfectly
      let calculatedSize = Math.min(heightBasedSize, widthBasedSize);
      
      // Ensure minimum readable size, but maximize space usage
      calculatedSize = Math.max(12, calculatedSize);
      
      setCellSize((prevSize) => {
        // Only update if size actually changed
        if (Math.abs(prevSize - calculatedSize) > 0.5) {
          return calculatedSize;
        }
        return prevSize;
      });
    };

    // Use ResizeObserver for precise measurements
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          updateSize();
        }
      }
    });
    
    resizeObserver.observe(container);
    
    // Initial calculation - try multiple times to ensure layout is complete
    let attempts = 0;
    const tryUpdate = () => {
      updateSize();
      attempts++;
      if (attempts < 5 && containerRef.current && containerRef.current.getBoundingClientRect().height === 0) {
        setTimeout(tryUpdate, 100);
      }
    };
    
    const timeoutId = setTimeout(tryUpdate, 50);
    
    // Also listen to window resize and orientation change
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateSize, 200);
    });
    
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'hsl(220 18% 15%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'hsl(220 15% 20%)';
    ctx.lineWidth = 1;
    for (let row = 0; row <= GRID_HEIGHT; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * cellSize);
      ctx.lineTo(GRID_WIDTH * cellSize, row * cellSize);
      ctx.stroke();
    }
    for (let col = 0; col <= GRID_WIDTH; col++) {
      ctx.beginPath();
      ctx.moveTo(col * cellSize, 0);
      ctx.lineTo(col * cellSize, GRID_HEIGHT * cellSize);
      ctx.stroke();
    }

    // Draw placed blocks
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        if (grid[row][col]) {
          ctx.fillStyle = grid[row][col] as string;
          ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
          
          // Add subtle gradient
          const gradient = ctx.createLinearGradient(
            col * cellSize,
            row * cellSize,
            col * cellSize,
            (row + 1) * cellSize
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
          ctx.fillStyle = gradient;
          ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }

    // Draw current block
    if (currentBlock) {
      ctx.fillStyle = currentBlock.color;
      currentBlock.shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell) {
            const x = (currentBlock.x + colIndex) * cellSize;
            const y = (currentBlock.y + rowIndex) * cellSize;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            
            // Add gradient to current block
            const gradient = ctx.createLinearGradient(x, y, x, y + cellSize);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            ctx.fillStyle = currentBlock.color;
          }
        });
      });
    }
  }, [grid, currentBlock, cellSize]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden flex items-center justify-center"
      style={{ 
        padding: '0',
        margin: '0',
        minHeight: 0,
        minWidth: 0
      }}
    >
      <canvas
        ref={canvasRef}
        width={GRID_WIDTH * cellSize}
        height={GRID_HEIGHT * cellSize}
        className="border border-game-border/50 block"
        style={{ 
          width: `${GRID_WIDTH * cellSize}px`,
          height: `${GRID_HEIGHT * cellSize}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'block',
          margin: '0 auto',
          borderRadius: '2px'
        }}
      />
    </div>
  );
};

export default GameBoard;
