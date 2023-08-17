export default function TreemapPerCurrency() {
    return (<svg version="1.1" className="highcharts-root"
                 style={{
                     fontFamily: 'Helvetica, Arial, sans-serif',
                     width: '100%',
                     fontSize: '2rem',
                     height: 'auto',
                 }}
                 xmlns="http://www.w3.org/2000/svg" width="100" height="90" viewBox="0 0 360 400" aria-hidden="false"
                 aria-label="Interactive chart">
        <rect fill="none" className="highcharts-plot-background" x="10" y="10" width="340" height="312" filter="none"
              aria-hidden="true"></rect>
        <rect fill="none" className="highcharts-plot-border" data-z-index="1" stroke="#cccccc" strokeWidth="0" x="10"
              y="10" width="340" height="312" aria-hidden="true"></rect>
        <g className="highcharts-series-group" data-z-index="3" filter="none" aria-hidden="false">
            <g className="highcharts-series highcharts-series-0 highcharts-treemap-series highcharts-color-0 highcharts-tracker"
               data-z-index="0.1" transform="translate(10,10) scale(1 1)" clipPath="url(#highcharts-acrkkjj-8-)"
               aria-hidden="false">
                <g className="highcharts-level-group-1" data-z-index="999" aria-hidden="false">
                    <rect x="-0.5" y="161.5" width="198" height="150" fill="rgb(76,126,108)" stroke="#e6e6e6"
                          strokeWidth="1" className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                          aria-label="USDT, value: 6." style={{outline: 'none'}}></rect>
                    <rect x="197.5" y="138.5" width="142" height="104" fill="rgb(127,183,155)" stroke="#e6e6e6"
                          strokeWidth="1" className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                          aria-label="EUR, value: 3." style={{outline: 'none'}}></rect>
                    <rect x="197.5" y="242.5" width="142" height="69" fill="rgb(152,211,178)" stroke="#e6e6e6"
                          strokeWidth="1" className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                          aria-label="UAH, value: 2." style={{outline: 'none'}}></rect>
                    <rect x="-0.5" y="-0.5" width="198" height="162" fill="rgb(50,97,84)" stroke="rgb(230,230,230)"
                          strokeWidth="1" className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                          aria-label="BTC, value: 6.5." data-z-index="0" style={{outline: 'none'}}></rect>
                    <rect x="197.5" y="-0.5" width="142" height="139" fill="rgb(101,154,131)" stroke="rgb(230,230,230)"
                          strokeWidth="1" className="highcharts-point highcharts-color-0" tabIndex={-1} role="img"
                          aria-label="USD, value: 4." data-z-index="0" style={{outline: 'none'}}></rect>
                </g>
            </g>
        </g>
        <g className="highcharts-data-labels highcharts-series-0 highcharts-treemap-series highcharts-color-0 highcharts-tracker"
           data-z-index="6" transform="translate(10,10) scale(1 1)" opacity="1" aria-hidden="true">
            <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
               filter="none" transform="translate(65,70)">
                <text x="5" data-z-index="1" y="16"
                      style={{
                          color: 'rgb(255, 255, 255)',
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          fill: 'rgb(255, 255, 255)'
                      }}>BTC
                </text>
            </g>
            <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
               filter="none" transform="translate(52,225)">
                <text x="5" data-z-index="1" y="16"
                      style={{
                          color: 'rgb(255, 255, 255)',
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          fill: 'rgb(255, 255, 255)'
                      }}>USDT
                </text>
            </g>
            <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
               filter="none" transform="translate(222,58)">
                <text x="5" data-z-index="1" y="16"
                      style={{
                          color: 'rgb(0, 0, 0)',
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          fill: 'rgb(0, 0, 0)'
                      }}>USD
                </text>
            </g>
            <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
               filter="none" transform="translate(222,179)">
                <text x="5" data-z-index="1" y="16"
                      style={{color: 'rgb(0, 0, 0)', fontSize: '2rem', fontWeight: 'bold', fill: 'rgb(0, 0, 0)'}}>
                    EUR
                </text>
            </g>
            <g className="highcharts-label highcharts-data-label highcharts-data-label-color-0" data-z-index="1"
               filter="none" transform="translate(221,266)">
                <text x="5" data-z-index="1" y="16"
                      style={{color: 'rgb(0, 0, 0)', fontSize: '2rem', fontWeight: 'bold', fill: 'rgb(0, 0, 0)'}}>
                    UAH
                </text>
            </g>
        </g>
    </svg>)
}