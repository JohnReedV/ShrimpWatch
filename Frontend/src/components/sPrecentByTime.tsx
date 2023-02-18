import { useRef, useEffect, useState } from 'react'
import { ShrimpPercentage, ChartData } from './IQueries'
import axios from 'axios'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import '../styles/Loading.css'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/graphql'
})

const getShrimpPercentage = async (timeStamp: number, dates: number): Promise<ShrimpPercentage[]> => {
  const timeStamps: number[] = Array.from({ length: dates }, (_, i) => timeStamp - (dates - i - 1) * 86400)
  const shrimps: ShrimpPercentage[] = Array.from({ length: dates }, () => ({ timestamp: 0, percentage: 0 }))
  const greatTimeStamp = Math.max(...timeStamps)

  const { data } = await axiosInstance.post('', {
    query: `
      query MyQuery {
        allBtcWallets {
          edges {
            node {
              id
              outputsByPublicKey(filter: { timeStamp: { lessThanOrEqualTo: "${greatTimeStamp}" } }) {
                edges {
                  node {
                    amount
                    timeStamp
                  }
                }
              }
              inputsByPublicKey(filter: { timeStamp: { lessThanOrEqualTo: "${greatTimeStamp}" } }) {
                edges {
                  node {
                    amount
                    timeStamp
                  }
                }
              }
            }
          }
        }
      }
    `,
  })

  const edges = data?.data?.allBtcWallets?.edges ?? []

  for (let i = 0; i < timeStamps.length; i++) {
    const dayTimeStamp = timeStamps[i]
    let wallets = new Set<string>()
    let walletsWithBalanceLessThanOne = 0

    for (let { node } of edges) {
      const { id, outputsByPublicKey, inputsByPublicKey } = node

      if (!outputsByPublicKey || !inputsByPublicKey) { continue }

      const outputs = outputsByPublicKey.edges
      const inputs = inputsByPublicKey.edges

      if (inputs.length <= 0 && outputs.length <= 0) { continue }

      let outputAmount = 0
      let inputAmount = 0

      for (let { node: output } of outputs) {
        if (output.timeStamp <= dayTimeStamp) {
          outputAmount += +output.amount
          wallets.add(id)
        }
      }

      for (let { node: input } of inputs) {
        if (input.timeStamp <= dayTimeStamp) {
          inputAmount += +input.amount
          wallets.add(id)
        }
      }

      const balanceAmount = outputAmount - inputAmount
      if (balanceAmount > 0 && balanceAmount < 1) { walletsWithBalanceLessThanOne++ }
    }

    const totalWallets = wallets.size
    const percentage = totalWallets > 0 ? (walletsWithBalanceLessThanOne / totalWallets) * 100 : 0
    shrimps[i] = {
      timestamp: dayTimeStamp,
      percentage: +percentage.toFixed(2),
    }
  }
  console.log(shrimps)
  return shrimps
}

export const GetshrimpPercentChart = ({ timeStamp, dates }: { timeStamp: number, dates: number }): JSX.Element => {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchAllShrimpData = async () => {
    try {
      const data: ShrimpPercentage[] = await getShrimpPercentage(timeStamp, dates)
      const chartData: ChartData[] = data.map((item) => ({
        x: item.timestamp * 1000,
        y: item.percentage,
      }))
      chartData[0].y = null
      chartData[chartData.length - 1].y = null
      setChartData(chartData)
      setIsLoading(false)
    } catch (err) {
      setError(true)
    }
  }

  useEffect(() => {
    fetchAllShrimpData()
  }, [])

  const chartRef = useRef<HighchartsReact>(null)

  const options: Highcharts.Options = {
    chart: {
      type: 'line',
      backgroundColor: {
        linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
        stops: [
          [0, '#292E49'],
          [1, '#536976'],
        ],
      },
      borderRadius: 10,
      style: {
        fontFamily: 'Arial',
      },
      animation: true,
    },
    credits: { enabled: false },
    title: {
      text: 'Shrimp Percentage Chart',
      style: {
        color: '#fff',
        fontWeight: 'bold',
      },
    },
    xAxis: {
      type: 'datetime',
      labels: {
        style: {
          color: '#fff',
        },
      },
    },
    yAxis: {
      title: {
        text: 'Percentage',
        style: {
          color: '#fff',
          fontWeight: 'bold',
        },
      },
      labels: {
        style: {
          color: '#fff',
        },
        format: '{value}%'
      },
      gridLineColor: '#444',
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      formatter: function () {
        return '<b>' + Highcharts.dateFormat('%e %b %y', this.x) + '</b><br/>' +
          this.series.name + ': ' + this.y + '%'
      }
    },
    series: [
      {
        name: 'Shrimp Percentage',
        data: chartData,
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, '#D4145A'],
            [1, '#FBB03B']
          ]
        },
        lineWidth: 3,
        marker: {
          symbol: 'circle',
          radius: 5,
          fillColor: '#000000',
          lineWidth: 2,
          lineColor: '#D4145A',
          animation: true,
        },
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(212, 20, 90, 0.5)'],
            [1, 'rgba(251, 176, 59, 0.5)']
          ]
        },
      },
    ],
  }
  return (
    <>
      {isLoading && <Loading />}
      {error && <p>An error occurred</p>}
      {!isLoading && !error && (
        <HighchartsReact highcharts={Highcharts} options={options} ref={chartRef} />
      )}
    </>
  )
}

const Loading = () => {
  return (
    <div className="loading">
      <div className="loading-spinner">
        <img src="src/assets/shrimp512.png" />
      </div>
      <p>Loading...</p>
    </div>
  )
}