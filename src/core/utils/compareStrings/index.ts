export default function compareStrings(a: string, b: string) {
    return (a < b) ? -1 : (a > b ? 1 : 0)
}