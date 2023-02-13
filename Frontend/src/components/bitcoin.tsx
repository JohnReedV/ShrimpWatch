import React from 'react'
import { GetLatestBitcoinTx } from './latestTxBtc'
import { GetshrimpPercent } from './shrimpPercentageBtc'
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

const Bitcoin = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <h3><GetshrimpPercent /></h3>
        </QueryClientProvider>
    )
}

export default Bitcoin