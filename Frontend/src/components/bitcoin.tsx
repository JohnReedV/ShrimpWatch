import {useRef} from 'react'
import { GetLatestBitcoinTx } from './latestTxBtc'
import { GetshrimpPercentChart } from './sPrecentByTime'
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

const Bitcoin = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <div><GetshrimpPercentChart timeStamp={1615310927}  dates={160}/></div>
        </QueryClientProvider>
    )
}

export default Bitcoin