import { SubmitButton } from '@/components/submit/SubmitButton';
import { GraphStatus } from './GraphStatus';

// App header: brand lockup (serif-italic accent) + live status + Submit.
export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-vs-border bg-vs-surface px-5">
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-semibold tracking-tight text-vs-ink">VectorShift</span>
        <span className="vs-em text-lg text-vs-accent">Builder</span>
      </div>
      <div className="flex items-center gap-5">
        <GraphStatus />
        <SubmitButton />
      </div>
    </header>
  );
}
