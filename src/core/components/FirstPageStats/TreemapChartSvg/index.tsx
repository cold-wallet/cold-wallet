import './index.css'

export default function TreemapChartSvg() {
    return (
        <svg version="1.1" className="highcharts-root"
             style={{
                 fontFamily: 'Helvetica, Arial, sans-serif',
                 fontSize: '2rem',
                 width: '100%',
             }}
             xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 320 400" aria-hidden="false"
             aria-label="Interactive chart">
            <g className="highcharts-series-group" data-z-index="3" filter="none" aria-hidden="false">
                <g className="highcharts-series highcharts-series-0 highcharts-treemap-series highcharts-color-0 highcharts-tracker"
                   data-z-index="0.1" transform="translate(10,48) scale(1 1)" clipPath="none" aria-hidden="false">
                    <g className="highcharts-level-group-1" data-z-index="999" aria-hidden="false">
                        <rect x="-0.5" y="141.5" width="153" height="132" fill="rgb(50,97,84)" stroke="#e6e6e6"
                              strokeWidth="1" className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                              aria-label="USDT, value: 6." style={{outline: 'none'}}></rect>
                        <rect x="152.5" y="90.5" width="92" height="110" fill="rgb(84,135,115)" stroke="#e6e6e6"
                              strokeWidth="1" className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                              aria-label="EUR, value: 3." style={{outline: 'none'}}></rect>
                        <rect x="152.5" y="200.5" width="92" height="73" fill="rgb(101,154,131)" stroke="#e6e6e6"
                              strokeWidth="1"
                              className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                              aria-label="UAH, value: 2."
                              style={{outline: 'none'}}></rect>
                        <rect x="244.5" y="212.5" width="55" height="61" fill="rgb(135,192,162)" stroke="#e6e6e6"
                              strokeWidth="1"
                              className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                              aria-label="BNB, value: 1."
                              style={{outline: 'none'}}></rect>
                        <rect x="-0.5" y="-0.5" width="153" height="142" fill="rgb(33,78,68)" stroke="#e6e6e6"
                              strokeWidth="1" className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                              aria-label="BTC, value: 6.5." data-z-index="0" style={{outline: 'none'}}></rect>
                        <rect x="244.5" y="90.5" width="55" height="122" fill="rgb(118,173,147)"
                              stroke="rgb(230,230,230)"
                              strokeWidth="1" className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                              aria-label="ETH, value: 2." data-z-index="0" style={{outline: 'none'}}></rect>
                        <rect x="152.5" y="-0.5" width="147" height="91" fill="rgb(67,116,99)"
                              stroke="rgb(230,230,230)"
                              strokeWidth="1" className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                              aria-label="USD, value: 4." data-z-index="0" style={{outline: 'none'}}></rect>
                    </g>
                </g>
                <g className="highcharts-markers highcharts-series-0 highcharts-treemap-series highcharts-color-0"
                   data-z-index="0.1" transform="translate(10,48) scale(1 1)" clipPath="none" aria-hidden="true"></g>
            </g>
            <g className="highcharts-data-labels highcharts-series-0 highcharts-treemap-series highcharts-color-0 highcharts-tracker"
               data-z-index="6" transform="translate(-15,48) scale(1 1)" opacity="1" aria-hidden="true">
                <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
                   filter="none"
                   transform="translate(59,60)">
                    <text x="5" data-z-index="1" y="16"
                          style={{
                              color: 'rgb(0, 0, 0)',
                              fontSize: '2rem',
                              fontWeight: 'bold',
                              fill: 'rgb(255, 255, 255)'
                          }}>
                        BTC
                    </text>
                </g>
                <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
                   filter="none"
                   transform="translate(56,196)">
                    <text x="5" data-z-index="1" y="16"
                          style={{
                              color: 'rgb(0, 0, 0)',
                              fontSize: '2rem',
                              fontWeight: 'bold',
                              fill: 'rgb(255, 255, 255)'
                          }}>
                        USDT
                    </text>
                </g>
                <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
                   filter="none"
                   transform="translate(209,34)">
                    <text x="5" data-z-index="1" y="16"
                          style={{color: 'rgb(0, 0, 0)', fontSize: '2rem', fontWeight: 'bold', fill: 'rgb(0, 0, 0)'}}>
                        USD
                    </text>
                </g>
                <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
                   filter="none"
                   transform="translate(182,134)">
                    <text x="5" data-z-index="1" y="16"
                          style={{color: 'rgb(0, 0, 0)', fontSize: '2rem', fontWeight: 'bold', fill: 'rgb(0, 0, 0)'}}>
                        EUR
                    </text>
                </g>
                <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
                   filter="none"
                   transform="translate(181,226)">
                    <text x="5" data-z-index="1" y="16"
                          style={{
                              color: 'rgb(0, 0, 0)',
                              fontSize: '2rem',
                              fontWeight: 'bold',
                              fill: 'rgb(0, 0, 0)'
                          }}>
                        UAH
                    </text>
                </g>
                <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
                   filter="none"
                   transform="translate(256,140)">
                    <text x="5" data-z-index="1" y="16"
                          style={{color: 'rgb(0, 0, 0)', fontSize: '2rem', fontWeight: 'bold', fill: 'rgb(0, 0, 0)'}}>
                    </text>
                </g>
                <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
                   filter="none"
                   transform="translate(255,232)">
                    <text x="5" data-z-index="1" y="16"
                          style={{color: 'rgb(0, 0, 0)', fontSize: '2rem', fontWeight: 'bold', fill: 'rgb(0, 0, 0)'}}>
                    </text>
                </g>
            </g>
        </svg>
    )
}
