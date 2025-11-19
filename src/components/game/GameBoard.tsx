import { useEffect, useRef, useState, memo } from 'react';
import { Block } from '@/types/game';
import { GRID_WIDTH, GRID_HEIGHT } from '@/utils/blockShapes';
import { useTheme } from '@/components/ThemeProvider';

export interface HighlightCell {
  x: number;
  y: number;
  color?: string;
  alpha?: number;
}

interface GameBoardProps {
  grid: (string | null)[][];
  currentBlock: Block | null;
  highlights?: HighlightCell[];
}

const GameBoard = memo(({ grid, currentBlock, highlights }: GameBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(24);
  const { theme } = useTheme();

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
    // Use named function for proper cleanup
    const handleOrientationChange = () => {
      setTimeout(updateSize, 200);
    };
    
    window.addEventListener('resize', updateSize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });
    
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for better performance
    if (!ctx) return;

    // Immediate rendering for responsiveness
    // Clear canvas - use CSS variable for theme-aware color
    const gameGridColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--game-grid')
      .trim();
    ctx.fillStyle = `hsl(${gameGridColor})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines - use CSS variable for theme-aware color
    const gameBorderColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--game-border')
      .trim();
    ctx.strokeStyle = `hsl(${gameBorderColor})`;
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
          const x = col * cellSize + 1;
          const y = row * cellSize + 1;
          const size = cellSize - 2;
          
          // Draw block with brighter fill
          ctx.fillStyle = grid[row][col] as string;
          ctx.fillRect(x, y, size, size);
          
          // Add very subtle gradient for depth (reduced opacity)
          const gradient = ctx.createLinearGradient(
            col * cellSize,
            row * cellSize,
            col * cellSize,
            (row + 1) * cellSize
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, size, size);
          
          // Add subtle outline for sharper edges
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        }
      }
    }

    // Draw current block
    if (currentBlock) {
      currentBlock.shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell) {
            const x = (currentBlock.x + colIndex) * cellSize + 1;
            const y = (currentBlock.y + rowIndex) * cellSize + 1;
            const size = cellSize - 2;
            
            // Draw block with brighter fill
            ctx.fillStyle = currentBlock.color;
            ctx.fillRect(x, y, size, size);
            
            // Add very subtle gradient for depth (reduced opacity)
            const gradient = ctx.createLinearGradient(
              (currentBlock.x + colIndex) * cellSize,
              (currentBlock.y + rowIndex) * cellSize,
              (currentBlock.x + colIndex) * cellSize,
              (currentBlock.y + rowIndex + 1) * cellSize
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, size, size);
            
            // Add subtle outline for sharper edges
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
          }
        });
      });
    }
    
    // Draw highlights from power-ups
    if (highlights?.length) {
      highlights.forEach(({ x, y, color, alpha }) => {
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
          return;
        }
        const px = x * cellSize + 1;
        const py = y * cellSize + 1;
        const size = cellSize - 2;
        ctx.save();
        ctx.fillStyle = color || 'rgba(255, 255, 255, 0.85)';
        ctx.globalAlpha = alpha !== undefined ? Math.max(0, Math.min(alpha, 1)) : 0.75;
        ctx.fillRect(px, py, size, size);
        ctx.restore();
      });
    }
  }, [grid, currentBlock, cellSize, theme, highlights]);

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
});

GameBoard.displayName = 'GameBoard';

export default GameBoard;
