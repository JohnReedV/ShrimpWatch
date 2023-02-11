import React from 'react'
import { GetLatestBitcoinTx } from '../dbHandler'
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

const Bitcoin = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <h3><GetLatestBitcoinTx /></h3>
        </QueryClientProvider>
    )
}

export default Bitcoin