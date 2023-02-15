import React from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import '../styles/Loading.css'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/graphql'
})

const shrimpAmountTimeStampQuery = (timeStamp: number) => {
  return useQuery('shrimpAmountTimeStamp', async () => {
    const { data } = await axiosInstance.post('', {
      query: `
      query MyQuery {
        allBtcWallets {
          edges {
            node {
              outputsByPublicKey(filter: {timeStamp: {lessThanOrEqualTo: "${timeStamp}"}}) {
                edges {
                  node {
                    amount
                  }
                }
              }
              inputsByPublicKey(filter: {timeStamp: {lessThanOrEqualTo: "${timeStamp}"}}) {
                edges {
                  node {
                    amount
                  }
                }
              }
            }
          }
        }
      }      
      `,
    })

    return data.data.allBtcWallets.edges
  })
}

const walletAmountQuery = () => {
  return useQuery('walletAmount', async () => {
    const { data } = await axiosInstance.post('', {
      query: `
      query anotherQ {
        allBtcWallets {
          totalCount
        }
      }
      `,
    })

    return data.data.allBtcWallets.totalCount
  })
}

export const GetshrimpPercent = ({ timeStamp }: { timeStamp: number }) => {

  let shrimpCount = 0
  const { data: walletAmount, isLoading: walletLoading, error: walletError } = walletAmountQuery()
  const { data: walletArray, isLoading: shrimpLoading, error: shrimpError } = shrimpAmountTimeStampQuery(timeStamp)

  if (walletLoading || shrimpLoading) return Loading()
  if (walletError || shrimpError) return <div>Error: {"Error!!"}</div>

  for (let i = 0; i < walletArray.length; i++) {
    const outputs = walletArray[i].node.outputsByPublicKey.edges
    const inputs = walletArray[i].node.inputsByPublicKey.edges

    let outputAmount = 0
    let inputAmount = 0
    for (let o = 0; o < outputs.length; o++) { outputAmount += outputs[o]?.node?.amount || 0  }
    for (let a = 0; a < outputs.length; a++) { inputAmount += inputs[a]?.node?.amount || 0  }

    const BALANCE_AT_TIMESTAMP = outputAmount - inputAmount

    if (BALANCE_AT_TIMESTAMP < 1) { shrimpCount += 1 }
  }
  const shrimpPercent = (shrimpCount / walletAmount) * 100

  return (
    <ul><h2>{shrimpPercent}%</h2></ul>
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
