import { Component } from 'react'
import '../App.css'

class ShrimpWatch extends Component {

  render() {
    return (
      <div className="ShrimpWatch">
        <h1>ShrimpWatch
        <a href="https://shrimpwatch.com" target="_blank">
            <img src="src/assets/shrimp512.png" className="logo" alt="ShrimpWatch Logo" />
          </a>
        </h1>
        <button className="btcbutton"> </button>
        <button className="ethbutton"> </button>
      </div>
    )
  }

}
  export default ShrimpWatch