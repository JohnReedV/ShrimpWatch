import { Component } from 'react'
import '../styles/ShrimpWatch.css'
import Bitcoin from './bitcoin'
import { Ethereum } from './ethereum'

class ShrimpWatch extends Component {
  ethereum = new Ethereum()

  handleBtcButtonClick = () => {
    this.setState({ btcbutton: !this.state.btcbutton })
  }

  handleEthButtonClick = () => {
    this.setState({ ethbutton: !this.state.ethbutton })
  }

  defaultPage = <div className="ShrimpWatch">
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
    <button className="twitterbutton" onClick={this.handleTwitterButtonClick}></button>
  </div>

  state = {
    btcbutton: false,
    ethbutton: false,
    default: this.defaultPage
  }

  render() {
    return (
      <div>
        {this.renderState()}
      </div>
    )
  }

  renderState() {
    if (this.state.btcbutton) {
      return Bitcoin()
    }
    else if (this.state.ethbutton) {
      return this.ethereum.eth()
    }
    else {
      return this.state.default
    }
  }

  handleGitButtonClick() { window.open('https://github.com/ShrimpWatch/ShrimpWatch') }
  handleDiscordButtonClick() { window.open('https://discord.gg/fZgBkgCzGb') }
  handleTwitterButtonClick() { window.open('https://twitter.com/shrimpwatcher') }

}
export default ShrimpWatch