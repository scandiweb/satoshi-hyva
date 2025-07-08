export function getLengthValue(rawValue: string) {
  // Supported: -10px, -20 (implied px), 30 (implied px), 40px, 50%
  let match = rawValue.match(/^(-?[0-9]+)(px|%)?$/);
  return match ? match[1] + (match[2] || "px") : undefined;
}
