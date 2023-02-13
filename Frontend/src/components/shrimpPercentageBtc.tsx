import React from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import '../styles/Loading.css'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/graphql'
})

const shrimpAmountQuery = () => {
  return useQuery('shrimpAmount', async () => {
    const { data } = await axiosInstance.post('', {
      query: `
      query MyQuery {
        allBtcWallets(filter: {balance: {lessThanOrEqualTo: "1"}}) {
          totalCount
        }
      }
      `,
    })

    return data.data.allBtcWallets.totalCount
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

export const GetshrimpPercent = () => {
  const { data: walletAmount, isLoading: walletLoading, error: walletError } = walletAmountQuery()
  const { data: shrimpAmount, isLoading: shrimpLoading, error: shrimpError } = shrimpAmountQuery()

  if (walletLoading || shrimpLoading) return Loading()
  if (walletError || shrimpError) return <div>Error: {"Error!!"}</div>

  const shrimpPercent = (shrimpAmount / walletAmount) * 100

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
