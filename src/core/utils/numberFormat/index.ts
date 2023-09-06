import noExponents from "../noExponents";

export default function numberFormat(fixMe: number, afterDecimalPoint: number) {
    if (afterDecimalPoint === 0) {
        return Math.round(fixMe)
    }
    let fixed = "" + noExponents(fixMe);
    if (fixed.indexOf(".") >= 0) {
        const [left, right] = fixed.split(/[.]/gi);
        if (right.length > afterDecimalPoint) {
            fixed = left + "." + right.slice(0, afterDecimalPoint)
        }
    }
    return +noExponents(fixed)
}

export function numberFormatByType(fixMe: number, type: ("crypto" | "fiat")) {
    let fixed = "" + noExponents(fixMe);
    if (fixed.indexOf(".") >= 0) {
        const [left, right] = fixed.split(/[.]/gi);
        const afterDecimalPoint = type === "crypto" ? 8 : 2;
        if (right.length > afterDecimalPoint) {
            fixed = left + "." + right.slice(0, afterDecimalPoint)
        }
    }
    return +noExponents(fixed)
}
