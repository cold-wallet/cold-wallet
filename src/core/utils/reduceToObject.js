export default function reduceToObject(array, reducer) {
    return array.reduce((result, element) => {
        const [indexA, valueA, indexB, valueB] = reducer(element)
        indexA && (result[indexA] = valueA);
        indexB && (result[indexB] = valueB);
        return result
    }, {})
}
