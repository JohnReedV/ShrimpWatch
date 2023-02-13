import React from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { BitcoinTransaction } from './IQueries'
import '../styles/Loading.css'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/graphql'
})

const latestTxQuery = () => {
  return useQuery('btctransactions', async () => {
    const { data } = await axiosInstance.post('', {
      query: `
      query {
          allBtcTransactions(orderBy: AMOUNT_ASC, first: 1) {
            edges {
              node {
                id
                timeStamp
                txHex
                blockNumber
                blockHash
                amount
                gas
                coinbase
              }
            }
          }
        }
      `,
    })

    return data.data.allBtcTransactions.edges
  })
}

export const GetLatestBitcoinTx = () => {


  const { data, isLoading, error } = latestTxQuery()

  if (isLoading) return Loading()
  if (error) return <div>Error: {"Error!!"}</div>

  return (
    <ul>
      {data.map((edge: { node: BitcoinTransaction }) => (
        <li key={edge.node.id}>
          <h2>{edge.node.id} : {edge.node.timeStamp} : {edge.node.amount}</h2>
        </li>
      ))}
    </ul>
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
