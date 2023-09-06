import {useEffect, useRef} from "react";

export default function useInterval(callback: () => void, delay: number | null) {
    const savedCallback = useRef<() => void>();

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        if (!delay) {
            return
        }

        function tick() {
            savedCallback.current && savedCallback.current();
        }

        let id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay]);
}
