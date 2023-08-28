export default function reduceToObject<T, R>(array: T[], reducer: (e: T) => [] | [string, R, string, R]) {
    return array.reduce((result: { [index: string]: R }, element) => {
        const [indexA, valueA, indexB, valueB] = reducer(element)
        indexA && valueA && (result[indexA] = valueA);
        indexB && valueB && (result[indexB] = valueB);
        return result
    }, {})
}
