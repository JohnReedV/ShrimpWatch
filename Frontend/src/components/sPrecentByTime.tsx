import { useRef, useEffect, useState, MouseEvent } from 'react'
import { AllBtcWalletsQueryResult, ShrimpPercentage } from './IQueries'
import axios from 'axios'
import '../styles/Loading.css'
import * as d3 from "d3"

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/graphql'
})

const shrimpAmountTimeStampQuery = (greatTimeStamp: number, smallTimeStamp: number): Promise<AllBtcWalletsQueryResult> => {
  return axiosInstance.post('', {
    query: `
    query MyQuery {
      allBtcWallets {
        edges {
          node {
            outputsByPublicKey(
              filter: {timeStamp: {lessThanOrEqualTo: "${greatTimeStamp}", greaterThanOrEqualTo: "${smallTimeStamp}"}}
            ) {
              edges {
                node {
                  amount
                  timeStamp
                }
              }
            }
            inputsByPublicKey(
              filter: {timeStamp: {lessThanOrEqualTo: "${greatTimeStamp}", greaterThanOrEqualTo: "${smallTimeStamp}"}}
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
        totalCount
      }
    }
    `,
  }).then(({ data }) => data.data as AllBtcWalletsQueryResult)
}

const walletAmountQuery = () => {
  return axiosInstance.post('', {
    query: `
      query anotherQ {
        allBtcWallets {
          totalCount
        }
      }
    `,
  }).then(({ data }) => data.data.allBtcWallets.totalCount)
}

const getshrimpPercent = (data: AllBtcWalletsQueryResult, walletAmount: number): ShrimpPercentage[] => {
  const shrimpData = data.allBtcWallets.edges
  const shrimpPercentages: ShrimpPercentage[] = []

  let latestTimestamp = 0;
  shrimpData.forEach(({ node: { inputsByPublicKey } }) => {
    inputsByPublicKey.edges.forEach(({ node }) => {
      if (node.timeStamp > latestTimestamp) {
        latestTimestamp = node.timeStamp
      }
    })
  })

  const dayInMilliseconds = 86400000

  for (let i = 1; i <= 30; i++) {
    const dayTimestamp = latestTimestamp - (i * dayInMilliseconds);
    const shrimpCount = shrimpData.reduce((count, { node: { inputsByPublicKey, outputsByPublicKey } }) => {
      const outputs = outputsByPublicKey.edges
      const inputs = inputsByPublicKey.edges
      let outputAmount = 0
      let inputAmount = 0

      for (let o = 0; o < outputs.length; o++) {
        outputAmount += outputs[o]?.node?.amount || 0
      }

      for (let a = 0; a < inputs.length; a++) {
        const input = inputs[a].node;
        if (input.timeStamp <= dayTimestamp) {
          inputAmount += input?.amount || 0
        }
      }

      const BALANCE_AT_TIMESTAMP = outputAmount - inputAmount

      if (BALANCE_AT_TIMESTAMP < 1) {
        count += 1
      }

      return count
    }, 0)

    const shrimpPercent = (shrimpCount / walletAmount) * 100
    shrimpPercentages.push({ date: new Date(dayTimestamp), percentage: shrimpPercent })
  }
  console.log(shrimpPercentages)
  return shrimpPercentages
}


export const GetshrimpPercentChart = ({ timeStamp }: { timeStamp: number }): JSX.Element => {
  const [chartData, setChartData] = useState<ShrimpPercentage[]>([])
  const [walletAmount, setWalletAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const timeStamps: number[] = []

  for (let i = 0; i < 30; i++) {
    timeStamps.push(timeStamp - (i * 86400000))
  }

  const fetchShrimpData = async (dayTimeStamp: number, timeStamp: number) => {
    try {
      const shrimpData = await shrimpAmountTimeStampQuery(timeStamp, dayTimeStamp)
      return shrimpData
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const fetchAllShrimpData = async () => {
    const greatestTimeStamp = Math.max(...timeStamps);
    const walletAmountResult = await walletAmountQuery();
    setWalletAmount(walletAmountResult);
    const results = await fetchShrimpData(greatestTimeStamp, timeStamp);
    const data = getshrimpPercent(results, walletAmountResult);
  
    setChartData(data)
    setIsLoading(false)
  }

  const fetchWalletAmount = async () => {
    try {
      const walletAmount = await walletAmountQuery()
      setWalletAmount(walletAmount)
    } catch (error) {
      console.error(error)
      setError(true)
    }
  }

  useEffect(() => {
    fetchWalletAmount().then(() => fetchAllShrimpData())
  }, [])

  const chartRef = useRef<HTMLDivElement>(null)
  const [chartInitialized, setChartInitialized] = useState(false)

  useEffect(() => {
    const margin = { top: 50, right: 50, bottom: 50, left: 50 }
    const width = 800 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    if (chartRef.current && chartData.length > 0 && !chartInitialized) {
      const svg = d3.select(chartRef.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)

      svg.append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "#4F8AD6")
        .attr("stroke-width", 2)

      svg.append("path")
        .attr("class", "area")
        .attr("fill", "#4F8AD6")
        .attr("opacity", 0.2)

      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0])
      svg.append('g')
        .call(d3.axisLeft(yScale).tickSizeOuter(0).tickPadding(10).ticks(5))
        .attr('font-size', '14px')
        .attr('font-family', 'sans-serif')
        .attr('color', '#444444')
        .select('.domain')
        .remove()

      setChartInitialized(true)
    }
    else if (chartRef.current && chartData.length > 0) {
      const svg = d3.select(chartRef.current).select("g")

      const xScale = d3.scaleTime()
        .domain([new Date(timeStamp - 29 * 86400000), new Date(timeStamp)])
        .range([0, width])

      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0])

      const line = d3.line<ShrimpPercentage>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.percentage))

      const area = d3.area<ShrimpPercentage>()
        .x((d) => xScale(d.date))
        .y0(height)
        .y1((d) => yScale(d.percentage))

      const svgLine = svg.select('.line')
        .datum(chartData)

      svgLine.enter()
        .append("path")
        .merge(svgLine)
        .transition()
        .duration(1000)
        .attr('d', line)

      const svgArea = svg.select('.area')
        .datum(chartData)

      svgArea.enter()
        .append("path")
        .merge(svgArea)
        .transition()
        .duration(1000)
        .attr('d', area)

      const yAxis = svg.select('.y-axis')
        .call(d3.axisLeft(yScale).tickSizeOuter(0).tickPadding(10).ticks(5))

      const dots = svg.selectAll(".dot")
        .data(chartData)

      dots.enter()
        .append("circle")
        .merge(dots)
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => yScale(d.percentage))
        .attr("r", 5)
        .attr("fill", "#4F8AD6")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("data-value", (d) => d.percentage)
        .on("mouseover", function (d) {
          const event = d3.event as MouseEvent
          const date = d.date ? d.date.toLocaleDateString() : ''
          const tooltip = d3.select('#tooltip')
          tooltip.style("opacity", 1)
            .html(`Doggy Percent: ${d.value}%<br/>Date: ${date}`)
            .style("left", `${event?.pageX + 10}px`)
            .style("top", `${event?.pageY - 10}px`)
        })
        .on("mouseout", (d) => {
          d3.select('#tooltip')
            .style("opacity", 0)
        })

      dots.exit().remove()

      dots.append("title")
        .text((d) => `${d.percentage}%`)

      dots.select("title")
        .text((d) => `${d.percentage}%`)
    }
  }, [chartRef, chartData, chartInitialized, timeStamp])

  return (
    <>
      {isLoading && <Loading />}
      {error && <p>An error occurred</p>}
      {!isLoading && !error && (
        <ul>
          <li style={{ display: "flex", justifyContent: "center" }}>
            <div ref={chartRef} style={{ maxWidth: "800px", margin: "0 auto" }}></div>
          </li>
        </ul>
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