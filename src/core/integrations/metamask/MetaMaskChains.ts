import {
    arbitrum,
    arbitrumGoerli,
    arbitrumNova,
    aurora,
    avalanche,
    avalancheFuji,
    base,
    baseGoerli,
    bearNetworkChainMainnet,
    boba,
    bronos,
    bsc,
    bxn,
    canto,
    celo,
    celoAlfajores,
    celoCannoli,
    classic,
    confluxESpace,
    cronos,
    crossbell,
    dfk,
    dogechain,
    edgeware,
    ekta,
    eos,
    evmos,
    fantom,
    fibo,
    filecoin,
    filecoinCalibration,
    filecoinHyperspace,
    flare,
    foundry,
    fuse,
    fuseSparknet,
    gnosis,
    gnosisChiado,
    gobi,
    goerli,
    haqqMainnet,
    haqqTestedge2,
    hardhat,
    harmonyOne,
    holesky,
    iotex,
    klaytn,
    kroma,
    kromaSepolia,
    linea,
    localhost,
    mainnet,
    mantle,
    meter,
    metis,
    metisGoerli,
    mev,
    moonbaseAlpha,
    moonbeam,
    moonbeamDev,
    moonriver,
    neonDevnet,
    nexi,
    nexilix,
    oasys,
    okc,
    opBNB,
    optimism,
    optimismGoerli,
    optimismSepolia,
    plinga,
    polygon,
    polygonMumbai,
    polygonZkEvm,
    pulsechain,
    pulsechainV4,
    qMainnet,
    rollux,
    ronin,
    saigon,
    scrollSepolia,
    sepolia,
    shardeumSphinx,
    skaleBlockBrawlers,
    skaleCalypso,
    skaleCryptoBlades,
    skaleCryptoColosseum,
    skaleEuropa,
    skaleExorde,
    skaleHumanProtocol,
    skaleNebula,
    skaleRazor,
    skaleTitan,
    songbird,
    syscoin,
    taikoJolnir,
    taraxa,
    telos,
    vechain,
    wanchain,
    xdc,
    zhejiang,
    zkSync,
    zora,
} from 'wagmi/chains'

export const metaMaskChains = [arbitrum,
    arbitrumGoerli,
    arbitrumNova,
    aurora,
    avalanche,
    avalancheFuji,
    base,
    baseGoerli,
    bearNetworkChainMainnet,
    boba,
    bronos,
    bsc,
    bxn,
    canto,
    celo,
    celoAlfajores,
    celoCannoli,
    classic,
    confluxESpace,
    cronos,
    crossbell,
    dfk,
    dogechain,
    edgeware,
    eos,
    evmos,
    ekta,
    fantom,
    fibo,
    filecoin,
    filecoinCalibration,
    filecoinHyperspace,
    flare,
    foundry,
    fuse,
    fuseSparknet,
    iotex,
    gobi,
    goerli,
    gnosis,
    gnosisChiado,
    hardhat,
    harmonyOne,
    haqqMainnet,
    haqqTestedge2,
    holesky,
    klaytn,
    kroma,
    kromaSepolia,
    linea,
    localhost,
    mainnet,
    mantle,
    meter,
    metis,
    metisGoerli,
    mev,
    moonbaseAlpha,
    moonbeam,
    moonbeamDev,
    moonriver,
    neonDevnet,
    nexi,
    nexilix,
    oasys,
    okc,
    optimism,
    optimismGoerli,
    optimismSepolia,
    opBNB,
    plinga,
    polygon,
    polygonMumbai,
    polygonZkEvm,
    pulsechain,
    pulsechainV4,
    qMainnet,
    rollux,
    ronin,
    saigon,
    scrollSepolia,
    sepolia,
    skaleBlockBrawlers,
    skaleCalypso,
    skaleCryptoBlades,
    skaleCryptoColosseum,
    skaleEuropa,
    skaleExorde,
    skaleHumanProtocol,
    skaleNebula,
    skaleRazor,
    skaleTitan,
    songbird,
    shardeumSphinx,
    syscoin,
    taraxa,
    taikoJolnir,
    telos,
    vechain,
    wanchain,
    xdc,
    zhejiang,
    zkSync,
    zora,
]

export const chainIdToName = metaMaskChains.reduce((merged, chain) => {
    merged[chain.id] = chain.name
    return merged
}, {} as { [chainId: number]: string })
