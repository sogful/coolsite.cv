
export function emu_timezone_hours() {
    return -new Date().getTimezoneOffset() / 60;
}
export function emu_locale() {
    return (globalThis.navigator && navigator.language) || 'en-US';
}
