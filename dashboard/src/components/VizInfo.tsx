type Props = { text: string; label?: string };

/** Hover/focus the “i” for the full note. <abbr> keeps headings valid (no button inside h2). */
export function VizInfo({ text, label = "More about this visual" }: Props) {
  return (
    <abbr className="viz-info" title={text} aria-label={label} tabIndex={0}>
      i
    </abbr>
  );
}
