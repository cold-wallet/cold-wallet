export default function BalancePerType() {
    return <svg width="400" height="400" role="img" viewBox="0 0 400 400"
                style={{pointerEvents: 'all', width: '100%', height: 'auto'}}>
        <g>
            <path d="M9.184850993605149e-15,-150A150,150,0,0,1,65.08256086763373,135.14533018536287L0,0Z"
                  transform="translate(200, 200)" role="presentation" shapeRendering="auto"
                  style={{fill: 'rgb(64, 145, 108)', padding: '10px', stroke: 'transparent', strokeWidth: 1}}></path>
            <path d="M65.08256086763373,135.14533018536287A150,150,0,1,1,-2.7554552980815446e-14,-150L0,0Z"
                  transform="translate(200, 200)" role="presentation" shapeRendering="auto"
                  style={{fill: 'rgb(82, 183, 136)', padding: '10px', stroke: 'transparent', strokeWidth: 1}}></path>
            <text direction="inherit" dx="0" dy="15.975" x="239" y="191" id="pie-labels-0">
                <tspan x="239" dx="0" textAnchor="start"
                       style={{
                           padding: '20px', fontSize: '45px', fontWeight: 'bold',
                           fontFamily: '"Gill Sans", "Gill Sans MT", Seravek, "Trebuchet MS", sans-serif',
                           letterSpacing: 'normal', fill: 'rgb(37, 37, 37)', stroke: 'transparent'
                       }}>
                    fiat
                </tspan>
            </text>
            <text direction="inherit" dx="0" dy="15.975" x="161" y="209" id="pie-labels-1">
                <tspan x="161" dx="0" textAnchor="end"
                       style={{
                           padding: '20px', fontSize: '45px', fontWeight: 'bold',
                           fontFamily: '"Gill Sans", "Gill Sans MT", Seravek, "Trebuchet MS", sans-serif',
                           letterSpacing: 'normal', fill: 'rgb(37, 37, 37)', stroke: 'transparent'
                       }}>
                    crypto
                </tspan>
            </text>
        </g>
    </svg>
}
