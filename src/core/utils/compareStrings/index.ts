export default function compareStrings(a: string, b: string) {
    return (a < b) ? -1 : (a > b ? 1 : 0)
}

export function compareStringsIgnoreCase(a: string, b: string) {
    return compareStrings(a.toLowerCase(), b.toLowerCase())
}
