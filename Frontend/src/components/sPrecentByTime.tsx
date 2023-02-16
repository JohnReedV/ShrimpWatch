import { useRef, useEffect, useState, MouseEvent } from 'react'
import { useQueryClient } from 'react-query'
import axios from 'axios'
import '../styles/Loading.css'
import * as d3 from "d3"

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/graphql'
})

const shrimpAmountTimeStampQuery = (timeStamp: number) => {
  return axiosInstance.post('', {
    query: `
      query MyQuery${timeStamp} {
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
  }).then(({ data }) => data.data.allBtcWallets.edges)
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

export const GetshrimpPercent = ({ shrimpData, walletAmount }: { shrimpData: any[], walletAmount: number }): number => {

  let shrimpCount = 0

  for (let i = 0; i < shrimpData.length; i++) {
    const outputs = shrimpData[i].node.outputsByPublicKey.edges
    const inputs = shrimpData[i].node.inputsByPublicKey.edges

    let outputAmount = 0
    let inputAmount = 0
    for (let o = 0; o < outputs.length; o++) { outputAmount += outputs[o]?.node?.amount || 0 }
    for (let a = 0; a < inputs.length; a++) { inputAmount += inputs[a]?.node?.amount || 0 }

    const BALANCE_AT_TIMESTAMP = outputAmount - inputAmount

    if (BALANCE_AT_TIMESTAMP < 1) { shrimpCount += 1 }
  }
  const shrimpPercent = (shrimpCount / walletAmount) * 100
  return shrimpPercent
}

export const GetshrimpPercentChart = ({ timeStamp }: { timeStamp: number }): JSX.Element => {
  const queryClient = useQueryClient()
  const [shrimpData, setShrimpData] = useState<any[]>([])
  const [walletAmount, setWalletAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchShrimpData = async () => {
      try {
        const shrimpData = await shrimpAmountTimeStampQuery(timeStamp)
        setShrimpData(shrimpData)
      } catch (error) {
        console.error(error)
        setError(true)
      }
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

    Promise.all([fetchShrimpData(), fetchWalletAmount()])
      .then(() => setIsLoading(false))
  }, [timeStamp, queryClient])

  const data: { date: Date, value: number }[] = []
  for (let i = 0; i < 30; i++) {
    const dayTimeStamp = timeStamp - (i * 86400000)
    const shrimpPercent = GetshrimpPercent({ shrimpData, walletAmount })
    if (shrimpPercent > 0) { data.push({ date: new Date(dayTimeStamp), value: shrimpPercent }) }
  }

  const chartRef = useRef<HTMLDivElement>(null)
  const [chartInitialized, setChartInitialized] = useState(false)

  useEffect(() => {
    const margin = { top: 50, right: 50, bottom: 50, left: 50 }
    const width = 800 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    if (chartRef.current && data && !chartInitialized) {
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
    else if (chartRef.current && data.length > 0) {

      const svg = d3.select(chartRef.current).select("g")

      const xScale = d3.scaleTime()
        .domain([new Date(timeStamp - 29 * 86400000), new Date(timeStamp)])
        .range([0, width])

      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0])

      const line = d3.line<{ date: Date, value: number }>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.value))

      const area = d3.area<{ date: Date, value: number }>()
        .x((d) => xScale(d.date))
        .y0(height)
        .y1((d) => yScale(d.value))

      const svgLine = svg.select('.line')
        .datum(data)

      svgLine.enter()
        .append("path")
        .merge(svgLine)
        .transition()
        .duration(1000)
        .attr('d', line)

      const svgArea = svg.select('.area')
        .datum(data)

      svgArea.enter()
        .append("path")
        .merge(svgArea)
        .transition()
        .duration(1000)
        .attr('d', area)

      const yAxis = svg.select('.y-axis')
        .call(d3.axisLeft(yScale).tickSizeOuter(0).tickPadding(10).ticks(5))

      const dots = svg.selectAll(".dot")
        .data(data)

      dots.enter()
        .append("circle")
        .merge(dots)
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => yScale(d.value))
        .attr("r", 5)
        .attr("fill", "#4F8AD6")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("data-value", (d) => d.value)
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
        .text((d) => `${d.value}%`)

      dots.select("title")
        .text((d) => `${d.value}%`)
    }
  }, [chartRef, data, chartInitialized, timeStamp])

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