/**
 * Color Contrast Checker Utility
 * Ensures WCAG AA/AAA compliance for text readability
 */

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
  const lum1 = getLuminance(...color1);
  const lum2 = getLuminance(...color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse HSL string from CSS variable
 */
export function parseHSL(hslString: string): [number, number, number] {
  // Handle formats like "195 100% 50%" or "hsl(195, 100%, 50%)"
  const values = hslString.match(/(\d+\.?\d*)/g);
  if (!values || values.length < 3) {
    throw new Error(`Invalid HSL string: ${hslString}`);
  }
  
  return [
    parseFloat(values[0]), // hue
    parseFloat(values[1]), // saturation
    parseFloat(values[2])  // lightness
  ];
}

/**
 * Get RGB from CSS HSL variable
 */
export function getRGBFromCSSVariable(variableName: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  
  const [h, s, l] = parseHSL(value);
  return hslToRgb(h, s, l);
}

/**
 * Check if contrast meets WCAG standards
 */
export function meetsWCAG(ratio: number, level: 'AA' | 'AAA' = 'AA', isLargeText: boolean = false): boolean {
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Get contrast status with details
 */
export function getContrastStatus(
  foregroundVar: string,
  backgroundVar: string,
  isLargeText: boolean = false
): {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  status: 'excellent' | 'good' | 'poor' | 'fail';
  foreground: [number, number, number];
  background: [number, number, number];
} {
  const foreground = getRGBFromCSSVariable(foregroundVar);
  const background = getRGBFromCSSVariable(backgroundVar);
  const ratio = getContrastRatio(foreground, background);
  
  const meetsAA = meetsWCAG(ratio, 'AA', isLargeText);
  const meetsAAA = meetsWCAG(ratio, 'AAA', isLargeText);
  
  let status: 'excellent' | 'good' | 'poor' | 'fail' = 'fail';
  if (meetsAAA) {
    status = 'excellent';
  } else if (meetsAA) {
    status = 'good';
  } else if (ratio >= 3) {
    status = 'poor';
  }
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    meetsAA,
    meetsAAA,
    status,
    foreground,
    background
  };
}

/**
 * Test all critical color combinations in the design system
 */
export function testDesignSystemContrast(): {
  theme: 'light' | 'dark';
  combinations: {
    name: string;
    foreground: string;
    background: string;
    result: ReturnType<typeof getContrastStatus>;
  }[];
  issues: string[];
} {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  
  const testCombinations = [
    { name: 'Body text', foreground: '--foreground', background: '--background' },
    { name: 'Card text', foreground: '--card-foreground', background: '--card' },
    { name: 'Primary button', foreground: '--primary-foreground', background: '--primary' },
    { name: 'Secondary button', foreground: '--secondary-foreground', background: '--secondary' },
    { name: 'Accent text', foreground: '--accent-foreground', background: '--accent' },
    { name: 'Muted text', foreground: '--muted-foreground', background: '--muted' },
    { name: 'Muted on background', foreground: '--muted-foreground', background: '--background' },
    { name: 'Destructive button', foreground: '--destructive-foreground', background: '--destructive' },
    { name: 'Popover text', foreground: '--popover-foreground', background: '--popover' },
  ];
  
  const combinations = testCombinations.map(combo => ({
    ...combo,
    result: getContrastStatus(combo.foreground, combo.background)
  }));
  
  const issues = combinations
    .filter(c => !c.result.meetsAA)
    .map(c => `${c.name}: ${c.result.ratio}:1 (needs 4.5:1 minimum)`);
  
  return {
    theme,
    combinations,
    issues
  };
}

/**
 * Log contrast test results to console
 */
export function logContrastResults(): void {
  const results = testDesignSystemContrast();
  
  console.group(`🎨 Design System Contrast Check (${results.theme} theme)`);
  
  results.combinations.forEach(combo => {
    const { ratio, meetsAA, meetsAAA, status } = combo.result;
    const icon = meetsAAA ? '✅' : meetsAA ? '✓' : '⚠️';
    const color = status === 'excellent' ? 'green' : status === 'good' ? 'blue' : status === 'poor' ? 'orange' : 'red';
    
    console.log(
      `%c${icon} ${combo.name}: ${ratio}:1 %c(${status})`,
      `color: ${color}; font-weight: bold`,
      `color: ${color}`
    );
  });
  
  if (results.issues.length > 0) {
    console.group('❌ Contrast Issues Found:');
    results.issues.forEach(issue => console.warn(issue));
    console.groupEnd();
  } else {
    console.log('%c✨ All combinations meet WCAG AA standards!', 'color: green; font-weight: bold');
  }
  
  console.groupEnd();
}