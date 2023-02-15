import React from 'react'
import { GetLatestBitcoinTx } from './latestTxBtc'
import { GetshrimpPercent } from './sPrecentByTime'
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

const Bitcoin = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <h3><GetshrimpPercent timeStamp={1609300655}/></h3>
        </QueryClientProvider>
    )
}

export default Bitcoin