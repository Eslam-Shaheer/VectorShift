import { useStore } from '@/store';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAutoResizeTextarea } from './fields/useAutoResize';

// Resolves a field's current value from node data, falling back to its default
// (which may be a function of the node id, e.g. "input_1").
function resolveValue(field, nodeId, data) {
  const stored = data?.[field.key];
  if (stored !== undefined) return stored;
  return typeof field.default === 'function' ? field.default(nodeId) : field.default ?? '';
}

// Renders one declared field. State is owned by the Zustand store (via
// updateNodeField) so field values live in node.data and reach the backend on
// submit — the original nodes used local useState and never persisted.
export function NodeField({ nodeId, field, onValueChange }) {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const data = useStore((s) => s.nodes.find((n) => n.id === nodeId)?.data);
  const value = resolveValue(field, nodeId, data);

  const setValue = (next) => {
    updateNodeField(nodeId, field.key, next);
    onValueChange?.(field.key, next);
  };

  const autoResizeRef = useAutoResizeTextarea(value, field.kind === 'textarea' && field.autoGrow);

  const control = (() => {
    switch (field.kind) {
      case 'select':
        return (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="nodrag">
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => {
                const [val, text] =
                  typeof opt === 'string' ? [opt, opt] : [opt.value, opt.label];
                return (
                  <SelectItem key={val} value={val}>
                    {text}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <Textarea
            ref={autoResizeRef}
            className="nodrag resize-none"
            rows={field.rows ?? 2}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      case 'number':
        return (
          <Input
            className="nodrag"
            type="number"
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      case 'display':
        return <p className="text-[13px] leading-relaxed text-vs-body">{field.text}</p>;
      case 'text':
      default:
        return (
          <Input
            className="nodrag"
            type="text"
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => setValue(e.target.value)}
          />
        );
    }
  })();

  if (field.kind === 'display') return control;

  return (
    <div className="flex flex-col gap-1">
      {field.label && <Label>{field.label}</Label>}
      {control}
    </div>
  );
}
