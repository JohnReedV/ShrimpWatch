import React from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'

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

    type BitcoinTransaction = {
        id: string,
        timeStamp: string,
        txHex: string,
        blockNumber: string,
        blockHash: string,
        amount: string,
        gas: string,
        coinbase: string
    };

    const { data, isLoading, error } = latestTxQuery()

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error: {"Error!!"}</div>

    return (
        <ul>
          {data.map((edge: { node: BitcoinTransaction }) => (
            <li key={edge.node.id}>
              <h2>{edge.node.timeStamp}</h2>
              <p>{edge.node.amount}</p>
            </li>
          ))}
        </ul>
      )
}
