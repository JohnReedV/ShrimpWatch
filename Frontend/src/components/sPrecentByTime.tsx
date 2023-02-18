import { useRef, useEffect, useState, MouseEvent } from 'react'
import { ShrimpPercentage } from './IQueries'
import axios from 'axios'
import '../styles/Loading.css'
import * as d3 from "d3"

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
  const smallTimeStamp = Math.min(...timeStamps)

  const shrimps: ShrimpPercentage[] = new Array(30).fill({ timestamp: 0, percentage: 0 })

  return axiosInstance.post('', {
    query: `
      query MyQuery {
        allBtcWallets {
          edges {
            node {
              id
              outputsByPublicKey(
                filter: { timeStamp: { greaterThanOrEqualTo: "${smallTimeStamp}", lessThanOrEqualTo: "${greatTimeStamp}" } }
              ) {
                edges {
                  node {
                    amount
                    timeStamp
                  }
                }
              }
              inputsByPublicKey(
                filter: { timeStamp: { greaterThanOrEqualTo: "${smallTimeStamp}", lessThanOrEqualTo: "${greatTimeStamp}" } }
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

          if (inputs.length <= 0 && outputs.length <= 0 ) { continue }

          let outputAmount = 0
          let inputAmount = 0

          for (let o = 0; o < outputs.length; o++) {
            const output = outputs[o].node
            if (output && output.timeStamp >= dayTimeStamp && output.timeStamp < dayTimeStamp + 86400) {
              outputAmount += output.amount
              wallets.add(address)
            }
          }

          for (let a = 0; a < inputs.length; a++) {
            const input = inputs[a].node
            if (input && input.timeStamp >= dayTimeStamp && input.timeStamp < dayTimeStamp + 86400) {
              inputAmount += input.amount
              wallets.add(address)
            }
          }

          const balanceAmount = outputAmount - inputAmount
          if (balanceAmount < 1) {
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
      return shrimps
    })
}

export const GetshrimpPercentChart = ({ timeStamp }: { timeStamp: number }): JSX.Element => {
  const [chartData, setChartData] = useState<ShrimpPercentage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchAllShrimpData = async () => {
    const data: ShrimpPercentage[] = await getShrimpPercentage(timeStamp)

    setChartData(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchAllShrimpData()
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
            .html(`Shrimp Percent: ${d.value}%<br/>Date: ${date}`)
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