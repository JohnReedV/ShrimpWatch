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
        <h2> {"\u2190"} Select a network {"\u2192"} </h2>
        <button className="btcbutton" onClick={this.handleBtcButtonClick}> </button>
        <button className="ethbutton" onClick={this.handleEthButtonClick}> </button>
        <button className="gitbutton" onClick={this.handleGitButtonClick}></button>
        <button className="discordbutton" onClick={this.handleDiscordButtonClick}></button>
      </div>
    )
  }

  handleBtcButtonClick = () => { window.location.href = 'https://shrimpwatch.com/bitcoin' }
  handleEthButtonClick = () => { window.location.href = 'https://shrimpwatch.com/ethereum' }
  handleGitButtonClick = () => { window.open('https://github.com/ShrimpWatch/ShrimpWatch') }
  handleDiscordButtonClick = () => { window.open('https://discord.gg/fZgBkgCzGb') }

}
export default ShrimpWatch