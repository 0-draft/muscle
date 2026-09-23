export const WHITE_LIGHTS: Record<'A' | 'B' | 'C' | 'D', number>;
export const LABELS: Record<'en' | 'ja', Record<'A' | 'B' | 'C' | 'D', string>>;
declare const remarkClaims: () => (tree: unknown, file: unknown) => void;
export default remarkClaims;
