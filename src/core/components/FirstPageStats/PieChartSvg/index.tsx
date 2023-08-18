import './index.css'

export default function PieChartSvg() {
    return <svg width="400" className={"pie-chart-svg"} height="300" role="img" viewBox="0 0 400 400"
                style={{
                    pointerEvents: 'all',
                    width: '100%',
                    height: '100%'
                }}>
        <g>
            <path d="M9.184850993605149e-15,-150A150,150,0,0,1,102.02591066563791,-109.95778077447395L0,0Z"
                  transform="translate(200, 200)" role="presentation" shapeRendering="auto"
                  style={{fill: 'rgb(64, 145, 108)', padding: '10px', stroke: 'transparent', strokeWidth: 1}}></path>
            <path d="M102.02591066563791,-109.95778077447395A150,150,0,0,1,117.27472237020447,93.52347027881002L0,0Z"
                  transform="translate(200, 200)" role="presentation" shapeRendering="auto"
                  style={{fill: 'rgb(82, 183, 136)', padding: '10px', stroke: 'transparent', strokeWidth: 1}}></path>
            <path d="M117.27472237020447,93.52347027881002A150,150,0,0,1,-117.27472237020447,93.52347027881004L0,0Z"
                  transform="translate(200, 200)" role="presentation" shapeRendering="auto"
                  style={{fill: 'rgb(116, 198, 157)', padding: '10px', stroke: 'transparent', strokeWidth: 1}}></path>
            <path d="M-117.27472237020447,93.52347027881004A150,150,0,0,1,-2.7554552980815446e-14,-150L0,0Z"
                  transform="translate(200, 200)" role="presentation" shapeRendering="auto"
                  style={{fill: 'rgb(149, 213, 178)', padding: '10px', stroke: 'transparent', strokeWidth: 1}}></path>
            <text direction="inherit" dx="0" dy="-6.525" x="215" y="163" id="pie-labels-0">
                <tspan x="215" dx="0" textAnchor="middle"
                       style={{
                           padding: '20px',
                           fontSize: '45px',
                           fontWeight: 'bold',
                           fontFamily: '"Gill Sans", "Gill Sans MT", Seravek, "Trebuchet MS", sans-serif',
                           letterSpacing: 'normal',
                           fill: 'rgb(37, 37, 37)',
                           stroke: 'transparent'
                       }}>
                    USD
                </tspan>
            </text>
            <text direction="inherit" dx="0" dy="15.975" x="240" y="197" id="pie-labels-1">
                <tspan x="240" dx="0" textAnchor="start"
                       style={{
                           padding: '20px',
                           fontSize: '45px',
                           fontWeight: 'bold',
                           fontFamily: '"Gill Sans", "Gill Sans MT", Seravek, "Trebuchet MS", sans-serif',
                           letterSpacing: 'normal',
                           fill: 'rgb(37, 37, 37)',
                           stroke: 'transparent'
                       }}>
                    BTC
                </tspan>
            </text>
            <text direction="inherit" dx="0" dy="38.475" x="200" y="240" id="pie-labels-2">
                <tspan x="200" dx="0" textAnchor="middle"
                       style={{
                           padding: '20px',
                           fontSize: '45px',
                           fontWeight: 'bold',
                           fontFamily: '"Gill Sans", "Gill Sans MT", Seravek, "Trebuchet MS", sans-serif',
                           letterSpacing: 'normal',
                           fill: 'rgb(37, 37, 37)',
                           stroke: 'transparent'
                       }}>
                    USD
                </tspan>
            </text>
            <text direction="inherit" dx="0" dy="15.975" x="164" y="183" id="pie-labels-3">
                <tspan x="164" dx="0" textAnchor="end"
                       style={{
                           padding: '20px',
                           fontSize: '45px',
                           fontWeight: 'bold',
                           fontFamily: '"Gill Sans", "Gill Sans MT", Seravek, "Trebuchet MS", sans-serif',
                           letterSpacing: 'normal',
                           fill: 'rgb(37, 37, 37)',
                           stroke: 'transparent'
                       }}>
                    EUR
                </tspan>
            </text>
        </g>
    </svg>
}
