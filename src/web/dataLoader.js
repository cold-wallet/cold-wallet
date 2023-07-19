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
    const [binanceData, setBinanceData] = useState(JSON.parse(localStorage.getItem('data1')));
    const [monobankData, setMonobankData] = useState(JSON.parse(localStorage.getItem('data2')));

    let loadBinance = () => {
        const fetchBinance = async () => {
            try {
                const response = await axios.get(urlBinance);
                setBinanceData(response.data);
            } catch (error) {
                console.warn('Error fetching data from binance:', error);
            }
        };
        fetchBinance();
    };

    let loadMonobank = () => {
        const fetchMonobank = async () => {
            try {
                const response = await axios.get(urlMonobank);
                setMonobankData(response.data[0]);
            } catch (error) {
                console.warn('Error fetching data from monobank:', error.response?.data?.errorDescription);
            }
        };
        fetchMonobank();
    };

    useEffect(() => {
        loadBinance();
        loadMonobank();
    }, []);

    useEffect(() => {
        if (binanceData && monobankData) {
            localStorage.setItem('data1', JSON.stringify(binanceData));
            localStorage.setItem('data2', JSON.stringify(monobankData));
        }
    }, [binanceData, monobankData]);

    useInterval(loadBinance, 1500);
    useInterval(loadMonobank, 60000);

    return (
        <div>
            <p>{binanceData ? `${binanceData.symbol}: ${binanceData.price}` : 'Loading...'}</p>
            <p>{monobankData ? `USDUAH: ${(monobankData.rateSell + monobankData.rateBuy) / 2}` : 'Loading...'}</p>
        </div>
    );
};

export default DataLoader;
