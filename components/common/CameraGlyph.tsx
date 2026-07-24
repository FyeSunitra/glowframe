/* CameraGlyph — inline SVG camera illustration using a hex colour */
interface CameraGlyphProps {
  color: string;
  size?: number;
}

export function CameraGlyph({ color, size = 120 }: CameraGlyphProps) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size}>
      <rect x="8" y="34" width="104" height="66" rx="14" fill={color} />
      <rect x="34" y="18" width="30" height="18" rx="6" fill={color} />
      <circle cx="60" cy="68" r="26" fill="#fff" />
      <circle cx="60" cy="68" r="18" fill={color} />
      <circle cx="60" cy="68" r="8" fill="#fff" fillOpacity="0.55" />
      <circle cx="94" cy="46" r="4" fill="#fff" />
    </svg>
  );
}
