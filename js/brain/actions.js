export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function normalizeAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}
