import { useEffect, useState } from 'react'
import axios from 'axios'
import { BtcTransaction } from './IQueries'
import '../styles/Loading.css'
import '../styles/latestTx.css'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/graphql'
})

async function latestTxQuery(): Promise<BtcTransaction[]> {
  const { data } = await axiosInstance.post('', {
    query: `query latestShrimpTx {
        allBtcTransactions(
          condition: {coinbase: false}
          orderBy: TIME_STAMP_DESC
          first: 10
          filter: {amount: {lessThanOrEqualTo: "1"}}
        ) {
          edges {
            node {
              id
              amount
              timeStamp
            }
          }
        }
      }`,
  })
  return data.data.allBtcTransactions.edges
}

export const GetLatestBitcoinTx = () => {
  const [data, setChartData] = useState<BtcTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showAllTransactions, setShowAllTransactions] = useState(false)

  useEffect(() => {
    const fetchAllShrimpData = async () => {
      try {
        const data = await latestTxQuery()
        setChartData(data)
        setIsLoading(false)
      } catch (err) {
        setError(true)
      }
    }
    fetchAllShrimpData()
  }, [])

  const firstTransaction = data[0]

  return (
    <div className="latest-tx-container">
      <h6 className="latest-tx-heading">Latest Shrimp Transactions</h6>
      {isLoading ? (
        <Loading />
      ) : data.length > 0 ? (
        <ul className="latest-tx-list">
          <li key={firstTransaction.node.id} className="latest-tx-item">
            <div className="latest-tx-id">
              <span className="latest-tx-label">TXID: </span>
              {firstTransaction.node.id}
            </div>
            <div className="latest-tx-amount">
              <span className="latest-tx-label">Amount: </span>
              {firstTransaction.node.amount} BTC
            </div>
            <div className="latest-tx-timestamp">
              <span className="latest-tx-label">Timestamp: </span>
              {new Date(firstTransaction.node.timeStamp * 1000).toLocaleString()}
            </div>
          </li>
          {showAllTransactions && data.slice(1).map((tx: BtcTransaction) => (
            <li key={tx.node.id} className="latest-tx-item">
              <div className="latest-tx-id">
                <span className="latest-tx-label">TXID: </span>
                {tx.node.id}
              </div>
              <div className="latest-tx-amount">
                <span className="latest-tx-label">Amount: </span>
                {tx.node.amount} BTC
              </div>
              <div className="latest-tx-timestamp">
                <span className="latest-tx-label">Timestamp: </span>
                {new Date(tx.node.timeStamp * 1000).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="latest-tx-error">No data available</p>
      )}
      {data.length > 1 && (
        <button className="latest-tx-expand" onClick={() => setShowAllTransactions(!showAllTransactions)}>
          {showAllTransactions ? 'Hide' : 'Show'} more transactions
          <span className={`latest-tx-arrow ${showAllTransactions ? 'latest-tx-arrow-up' : 'latest-tx-arrow-down'}`}></span>
        </button>
      )}
    </div>
  )
}

export const Loading = () => {
  return (
    <div className="loading">
      <div className="loading-spinner">
        <img src="src/assets/shrimp512.png" />
      </div>
      <p>Loading...</p>
    </div>
  )
}
