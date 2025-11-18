import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Block } from '@/types/game';
import {
  getRandomBlock,
  rotateShape,
  createEmptyGrid,
  GRID_WIDTH,
  GRID_HEIGHT
} from '@/utils/blockShapes';
import { ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { GAME_CONSTANTS } from '@/utils/gameConstants';
import { hapticImpact } from '@/utils/haptics';

const BASE_SPEED = GAME_CONSTANTS.BASE_SPEED;
const SPEED_INCREASE_PER_LEVEL = GAME_CONSTANTS.SPEED_INCREASE_PER_LEVEL;

export const useGameLoop = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const { shape, color } = getRandomBlock();
    const nextBlockData = getRandomBlock();
    return {
      grid: createEmptyGrid(),
      currentBlock: {
        shape,
        color,
        x: Math.floor(GRID_WIDTH / 2) - Math.floor(shape[0].length / 2),
        y: 0,
        id: Math.random().toString()
      },
      nextBlock: {
        shape: nextBlockData.shape,
        color: nextBlockData.color,
        x: 0,
        y: 0,
        id: Math.random().toString()
      },
      score: 0,
      level: 1,
      linesCleared: 0,
      gameOver: false,
      paused: false,
      speed: BASE_SPEED
    };
  });

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Load selected level on mount
  useEffect(() => {
    loadSelectedLevel();
  }, []);

  const loadSelectedLevel = async () => {
    try {
      const { value } = await Preferences.get({ key: 'gameProgress' });
      if (value) {
        const progress = JSON.parse(value);
        const selectedLevel = progress.currentLevel || 1;
        const levelSpeed = Math.max(100, BASE_SPEED - (selectedLevel - 1) * SPEED_INCREASE_PER_LEVEL);
        
        setGameState(prevState => ({
          ...prevState,
          level: selectedLevel,
          speed: levelSpeed
        }));
      }
    } catch (error) {
      console.error('Failed to load level:', error);
    }
  };

  const checkCollision = useCallback((block: Block, grid: (string | null)[][], offsetX = 0, offsetY = 0): boolean => {
    return block.shape.some((row, rowIndex) =>
      row.some((cell, colIndex) => {
        if (!cell) return false;
        const newX = block.x + colIndex + offsetX;
        const newY = block.y + rowIndex + offsetY;
        return (
          newX < 0 ||
          newX >= GRID_WIDTH ||
          newY >= GRID_HEIGHT ||
          (newY >= 0 && grid[newY]?.[newX])
        );
      })
    );
  }, []);

  const clearLine = useCallback((state: GameState, lineIndex: number): GameState => {
    const newGrid = state.grid.map(row => [...row]);
    newGrid.splice(lineIndex, 1);
    newGrid.unshift(Array(GRID_WIDTH).fill(null));
    
    const newScore = state.score + (GAME_CONSTANTS.POINTS_PER_LINE * state.level);
    const newLevel = Math.floor(newScore / GAME_CONSTANTS.SCORE_PER_LEVEL) + 1;
    const newSpeed = Math.max(GAME_CONSTANTS.MIN_SPEED, BASE_SPEED - (newLevel - 1) * SPEED_INCREASE_PER_LEVEL);
    
    return {
      ...state,
      grid: newGrid,
      score: newScore,
      level: newLevel,
      speed: newSpeed,
      linesCleared: state.linesCleared + 1
    };
  }, []);

  const clearArea = useCallback((state: GameState, centerX: number, centerY: number, radius: number): GameState => {
    const newGrid = state.grid.map(row => [...row]);
    let cellsCleared = 0;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const y = centerY + dy;
        const x = centerX + dx;
        if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH && newGrid[y][x]) {
          newGrid[y][x] = null;
          cellsCleared++;
        }
      }
    }
    
    // Move down blocks above cleared areas
    for (let col = 0; col < GRID_WIDTH; col++) {
      const column = [];
      for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
        if (newGrid[row][col]) {
          column.push(newGrid[row][col]);
        }
      }
      for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
        newGrid[row][col] = column[GRID_HEIGHT - 1 - row] || null;
      }
    }
    
    const bonusScore = cellsCleared * 10 * state.level;
    const newScore = state.score + bonusScore;
    const newLevel = Math.floor(newScore / GAME_CONSTANTS.SCORE_PER_LEVEL) + 1;
    const newSpeed = Math.max(GAME_CONSTANTS.MIN_SPEED, BASE_SPEED - (newLevel - 1) * SPEED_INCREASE_PER_LEVEL);
    
    return {
      ...state,
      grid: newGrid,
      score: newScore,
      level: newLevel,
      speed: newSpeed
    };
  }, []);

  const placeBlock = useCallback((state: GameState): GameState => {
    const newGrid = state.grid.map(row => [...row]);
    state.currentBlock?.shape.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell && state.currentBlock) {
          const x = state.currentBlock.x + colIndex;
          const y = state.currentBlock.y + rowIndex;
          if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
            newGrid[y][x] = state.currentBlock.color;
          }
        }
      });
    });

    // Check for completed lines
    let linesCleared = 0;
    const clearedGrid = newGrid.filter(row => {
      if (row.every(cell => cell !== null)) {
        linesCleared++;
        return false;
      }
      return true;
    });

    // Add empty rows at top
    while (clearedGrid.length < GRID_HEIGHT) {
      clearedGrid.unshift(Array(GRID_WIDTH).fill(null));
    }

    const newScore = state.score + (linesCleared * GAME_CONSTANTS.POINTS_PER_LINE * state.level);
    const newLevel = Math.floor(newScore / GAME_CONSTANTS.SCORE_PER_LEVEL) + 1;
    const newSpeed = Math.max(GAME_CONSTANTS.MIN_SPEED, BASE_SPEED - (newLevel - 1) * SPEED_INCREASE_PER_LEVEL);

    // Haptic feedback on line clear
    if (linesCleared > 0) {
      hapticImpact(ImpactStyle.Medium);
    }

    // Check if top row has any blocks (game over condition)
    const topRowHasBlocks = clearedGrid[0]?.some(cell => cell !== null);
    if (topRowHasBlocks) {
      hapticImpact(ImpactStyle.Heavy);
      return {
        ...state,
        grid: clearedGrid,
        currentBlock: null,
        score: newScore,
        level: newLevel,
        linesCleared: state.linesCleared + linesCleared,
        speed: newSpeed,
        gameOver: true
      };
    }

    const nextBlockData = getRandomBlock();
    const newCurrentBlock: Block = {
      ...state.nextBlock!,
      x: Math.floor(GRID_WIDTH / 2) - Math.floor(state.nextBlock!.shape[0].length / 2),
      y: 0,
      id: Math.random().toString()
    };

    // Check if game over (next block can't be placed)
    if (checkCollision(newCurrentBlock, clearedGrid)) {
      hapticImpact(ImpactStyle.Heavy);
      return {
        ...state,
        grid: clearedGrid,
        currentBlock: null,
        score: newScore,
        level: newLevel,
        linesCleared: state.linesCleared + linesCleared,
        speed: newSpeed,
        gameOver: true
      };
    }

    return {
      ...state,
      grid: clearedGrid,
      currentBlock: newCurrentBlock,
      nextBlock: {
        shape: nextBlockData.shape,
        color: nextBlockData.color,
        x: 0,
        y: 0,
        id: Math.random().toString()
      },
      score: newScore,
      level: newLevel,
      linesCleared: state.linesCleared + linesCleared,
      speed: newSpeed
    };
  }, [checkCollision]);

  const moveDown = useCallback(() => {
    setGameState(state => {
      if (state.gameOver || state.paused || !state.currentBlock) return state;

      if (!checkCollision(state.currentBlock, state.grid, 0, 1)) {
        return {
          ...state,
          currentBlock: {
            ...state.currentBlock,
            y: state.currentBlock.y + 1
          }
        };
      } else {
        return placeBlock(state);
      }
    });
  }, [checkCollision, placeBlock]);

  const moveLeft = useCallback(() => {
    hapticImpact(ImpactStyle.Light);
    setGameState(state => {
      if (state.gameOver || state.paused || !state.currentBlock) return state;
      if (!checkCollision(state.currentBlock, state.grid, -1, 0)) {
        return {
          ...state,
          currentBlock: {
            ...state.currentBlock,
            x: state.currentBlock.x - 1
          }
        };
      }
      return state;
    });
  }, [checkCollision]);

  const moveRight = useCallback(() => {
    hapticImpact(ImpactStyle.Light);
    setGameState(state => {
      if (state.gameOver || state.paused || !state.currentBlock) return state;
      if (!checkCollision(state.currentBlock, state.grid, 1, 0)) {
        return {
          ...state,
          currentBlock: {
            ...state.currentBlock,
            x: state.currentBlock.x + 1
          }
        };
      }
      return state;
    });
  }, [checkCollision]);

  const rotate = useCallback(() => {
    hapticImpact(ImpactStyle.Light);
    setGameState(state => {
      if (state.gameOver || state.paused || !state.currentBlock) return state;
      const rotated = rotateShape(state.currentBlock.shape);
      const rotatedBlock = { ...state.currentBlock, shape: rotated };
      if (!checkCollision(rotatedBlock, state.grid)) {
        return {
          ...state,
          currentBlock: rotatedBlock
        };
      }
      return state;
    });
  }, [checkCollision]);

  const togglePause = useCallback(() => {
    setGameState(state => ({
      ...state,
      paused: !state.paused
    }));
  }, []);

  const resetGame = useCallback(async (selectedLevel?: number) => {
    // Load selected level if not provided
    let level = selectedLevel;
    if (level === undefined) {
      try {
        const { value } = await Preferences.get({ key: 'gameProgress' });
        if (value) {
          const progress = JSON.parse(value);
          level = progress.currentLevel || 1;
        } else {
          level = 1;
        }
      } catch (error) {
        console.error('Failed to load level:', error);
        level = 1;
      }
    }
    
    const levelSpeed = Math.max(100, BASE_SPEED - (level - 1) * SPEED_INCREASE_PER_LEVEL);
    const { shape, color } = getRandomBlock();
    const nextBlockData = getRandomBlock();
    setGameState({
      grid: createEmptyGrid(),
      currentBlock: {
        shape,
        color,
        x: Math.floor(GRID_WIDTH / 2) - Math.floor(shape[0].length / 2),
        y: 0,
        id: Math.random().toString()
      },
      nextBlock: {
        shape: nextBlockData.shape,
        color: nextBlockData.color,
        x: 0,
        y: 0,
        id: Math.random().toString()
      },
      score: 0,
      level: level,
      linesCleared: 0,
      gameOver: false,
      paused: false,
      speed: levelSpeed
    });
  }, []);

  useEffect(() => {
    // Clear any existing interval first
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    if (gameState.gameOver || gameState.paused) {
      return;
    }

    // Create new interval
    gameLoopRef.current = setInterval(() => {
      moveDown();
    }, gameState.speed);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState.speed, gameState.gameOver, gameState.paused, moveDown]);

  return {
    gameState,
    setGameState,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    togglePause,
    resetGame,
    clearLine,
    clearArea
  };
};
