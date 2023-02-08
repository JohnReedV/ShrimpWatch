import { Component } from 'react'
import '../App.css'

class ShrimpWatch extends Component {

  render() {
    return (
      <div className="ShrimpWatch">
        <div>
          <a href="https://shrimpwatch.com" target="_blank">
            <img src="src/assets/shrimp512.svg" className="logo" alt="ShrimpWatch Logo" />
          </a>
        </div>
        <h1>ShrimpWatch</h1>
      </div>
    )
  }

}
  export default ShrimpWatch