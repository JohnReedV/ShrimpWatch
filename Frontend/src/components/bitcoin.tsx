import { useRef } from 'react'
import { GetLatestBitcoinTx } from './latestTxBtc'
import { GetshrimpPercentChart } from './sPrecentByTime'
import { QueryClient, QueryClientProvider } from 'react-query'

const Bitcoin = ({ queryClient }: { queryClient: QueryClient }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <div>
                <h1>ShrimpWatch
                    <a href="https://shrimpwatch.com" target="_blank">
                        <img src="src/assets/shrimp512.png" className="logo" alt="ShrimpWatch Logo" />
                    </a>
                </h1>
            </div>
            <div>
                <GetshrimpPercentChart timeStamp={1619310927} dates={160} />
            </div>
            <div>
                <GetLatestBitcoinTx />
            </div>
        </QueryClientProvider>
    )
}

export default Bitcoin