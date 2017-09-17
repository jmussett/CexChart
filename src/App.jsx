import React, { Component } from 'react';
import CexChart from './CexChart'

class App extends Component {
  render() {
    return (
    	<div>
    		<h3><a href="http://jmussett.github.io">jmussett.github.io</a></h3>
	    	<h1>Bitcoin CandleStick Chart</h1>
	    	<p>The following is a live CandleStick chart for the value of Bitcoin taken directly from the CEX Bitcoin exchange using their public WebSocket API.</p>
	    	<p>I've used a visualisation library called <a href="https://d3js.org/">D3</a> to render and scale the chart using SVG elements.</p>
	    	<p>I also use a component library called <a href="https://facebook.github.io/react/">React</a> to build it as a component, allowing for customisation and reusibility.</p>
	      	<p>This chart uses the most up to date records from the exchange. If you would like to view a more history view of the Bitcoin market value, please visit <a href="https://cex.io/">Cex.IO</a></p>
	      	<CexChart width={600} height={400} padding={40}></CexChart>
	    </div>
    );
  }
}

export default App;
