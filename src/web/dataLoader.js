import React, {useEffect, useRef, useState} from 'react';
import axios from 'axios';

const urlBinance = 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT';
const urlMonobank = 'https://api.monobank.ua/bank/currency';

function useInterval(callback, delay) {
    const savedCallback = useRef();

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        function tick() {
            savedCallback.current();
        }

        let id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay]);
}

const DataLoader = () => {
    const [data1, setData1] = useState(JSON.parse(localStorage.getItem('data1')));
    const [data2, setData2] = useState(JSON.parse(localStorage.getItem('data2')));

    let loadBinance = () => {
        const fetchBinance = async () => {
            try {
                const response = await axios.get(urlBinance);
                setData1(response.data);
            } catch (error) {
                console.error('Error fetching data from binance:', error);
            }
        };
        fetchBinance();
    };

    let loadMonobank = () => {
        const fetchMonobank = async () => {
            try {
                const response = await axios.get(urlMonobank);
                setData2(response.data[0]);
            } catch (error) {
                console.error('Error fetching data from monobank:', error);
            }
        };
        fetchMonobank();
    };

    useEffect(() => {
        loadBinance();
        loadMonobank();
    }, []);

    useEffect(() => {
        if (data1 && data2) {
            localStorage.setItem('data1', JSON.stringify(data1));
            localStorage.setItem('data2', JSON.stringify(data2));
        }
    }, [data1, data2]);

    useInterval(() => loadBinance(), 1500);
    useInterval(() => loadMonobank(), 30000);

    return (
        <div>
            <p>{data1 ? `${data1.symbol}: ${data1.price}` : 'Loading...'}</p>
            <p>{data2 ? `USDUAH: ${(data2.rateSell + data2.rateBuy) / 2}` : 'Loading...'}</p>
        </div>
    );
};

export default DataLoader;
