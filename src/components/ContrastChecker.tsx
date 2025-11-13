import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { testDesignSystemContrast, logContrastResults } from '@/utils/contrastChecker';
import { useTheme } from '@/components/ThemeProvider';

/**
 * Debug component to visualize contrast ratios
 * Only visible in development mode
 */
const ContrastChecker = () => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof testDesignSystemContrast> | null>(null);

  useEffect(() => {
    if (isOpen) {
      const testResults = testDesignSystemContrast();
      setResults(testResults);
      logContrastResults();
    }
  }, [isOpen, theme]);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'poor': return 'text-warning';
      case 'fail': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'poor':
      case 'fail':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50 glass-card border-primary/30 shadow-glow"
      >
        <Eye className="h-4 w-4 mr-2" />
        Contrast Checker
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md max-h-[80vh] overflow-hidden">
      <Card variant="glass" className="shadow-premium border-primary/30">
        <div className="p-4 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />
            <h3 className="font-semibold">Contrast Checker</h3>
            <Badge variant="glass" className="text-xs">
              {results?.theme}
            </Badge>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {results?.issues && results.issues.length > 0 && (
            <Card variant="glass" className="p-3 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Contrast Issues Found:</p>
                  {results.issues.map((issue, idx) => (
                    <p key={idx} className="text-muted-foreground">{issue}</p>
                  ))}
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Combination</span>
              <span>Ratio / Status</span>
            </div>

            {results?.combinations.map((combo, idx) => (
              <div
                key={idx}
                className="glass-card p-3 rounded-lg border border-primary/10 hover:border-primary/20 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{combo.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={combo.result.meetsAA ? 'glass' : 'outline'}
                      className={`text-xs ${getStatusColor(combo.result.status)}`}
                    >
                      {combo.result.ratio}:1
                    </Badge>
                    <span className={getStatusColor(combo.result.status)}>
                      {getStatusIcon(combo.result.status)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 text-xs">
                  <Badge variant={combo.result.meetsAA ? 'default' : 'outline'} className="text-xs">
                    {combo.result.meetsAA ? '✓' : '✗'} AA
                  </Badge>
                  <Badge variant={combo.result.meetsAAA ? 'default' : 'outline'} className="text-xs">
                    {combo.result.meetsAAA ? '✓' : '✗'} AAA
                  </Badge>
                </div>

                <div className="flex gap-2 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{
                        backgroundColor: `rgb(${combo.result.foreground.join(',')})`,
                      }}
                    />
                    <span className="text-muted-foreground">FG</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{
                        backgroundColor: `rgb(${combo.result.background.join(',')})`,
                      }}
                    />
                    <span className="text-muted-foreground">BG</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Card variant="glass" className="p-3 text-xs space-y-1 border-primary/10">
            <p className="font-semibold">WCAG Standards:</p>
            <p className="text-muted-foreground">• AA: 4.5:1 (normal text), 3:1 (large text)</p>
            <p className="text-muted-foreground">• AAA: 7:1 (normal text), 4.5:1 (large text)</p>
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default ContrastChecker;