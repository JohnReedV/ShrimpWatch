import { Component } from 'react'
import { GetshrimpPercentChartEth } from './sPrecentByTimeEth'
import { QueryClient, QueryClientProvider } from 'react-query'

const Eth = ({ queryClient }: { queryClient: QueryClient }) => {
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
                <GetshrimpPercentChartEth timeStamp={1539330836} />
            </div>
        </QueryClientProvider>
    )
}

export default Eth