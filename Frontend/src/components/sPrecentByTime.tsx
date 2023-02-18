import { useRef, useEffect, useState } from 'react'
import { ShrimpPercentage, ChartData } from './IQueries'
import axios from 'axios'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import '../styles/Loading.css'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/graphql'
})

const getShrimpPercentage = (timeStamp: number): Promise<ShrimpPercentage[]> => {
  const timeStamps: number[] = []
  for (let i = 0; i < 29; i++) {
    timeStamps.push(timeStamp + i * 86400)
  }
  timeStamps.push(timeStamp)

  const greatTimeStamp = Math.max(...timeStamps)
  const shrimps: ShrimpPercentage[] = new Array(30).fill({ timestamp: 0, percentage: 0 })

  return axiosInstance.post('', {
    query: `
      query MyQuery {
        allBtcWallets {
          edges {
            node {
              id
              outputsByPublicKey(
                filter: { timeStamp: { lessThanOrEqualTo: "${greatTimeStamp}" } }
              ) {
                edges {
                  node {
                    amount
                    timeStamp
                  }
                }
              }
              inputsByPublicKey(
                filter: { timeStamp: { lessThanOrEqualTo: "${greatTimeStamp}" } }
              ) {
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
    .then(({ data }) => {
      const edges = data.data.allBtcWallets.edges

      for (let i = 0; i < timeStamps.length; i++) {

        const dayTimeStamp = timeStamps[i]
        let wallets: Set<string> = new Set()
        let walletsWithBalanceLessThanOne = 0

        for (let node of edges) {
          const address = node.node.id
          const outputs = node.node.outputsByPublicKey.edges
          const inputs = node.node.inputsByPublicKey.edges

          if (inputs.length <= 0 && outputs.length <= 0) { continue }

          let outputAmount = 0
          let inputAmount = 0

          for (let o = 0; o < outputs.length; o++) {
            const output = outputs[o].node
            if (output && output.timeStamp <= dayTimeStamp) {
              outputAmount += parseFloat(output.amount)
              wallets.add(address)
            }
          }

          for (let a = 0; a < inputs.length; a++) {
            const input = inputs[a].node
            if (input && input.timeStamp <= dayTimeStamp) {
              inputAmount += parseFloat(input.amount)
              wallets.add(address)
            }
          }

          const balanceAmount = outputAmount - inputAmount
          if (balanceAmount < 1 && balanceAmount > 0) {
            walletsWithBalanceLessThanOne++
          }
        }
        const totalWallets = wallets.size
        const percentage = (totalWallets > 0) ? (walletsWithBalanceLessThanOne / totalWallets) * 100 : 0
        shrimps[i] = {
          timestamp: dayTimeStamp,
          percentage: parseFloat(percentage.toFixed(2)),
        }
      }
      console.log(shrimps)
      return shrimps
    })
}

export const GetshrimpPercentChart = ({ timeStamp }: { timeStamp: number }): JSX.Element => {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchAllShrimpData = async () => {
    try {
      const data: ShrimpPercentage[] = await getShrimpPercentage(timeStamp)
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