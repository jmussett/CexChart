import React, {Component} from "react"
import CexWsClient from './CexWsClient'
import * as d3 from 'd3'
import * as d3Axis from 'd3-axis'
import * as d3Scale from 'd3-scale'

var periodStates = [
{
	text: "1m",
	selected: true
},
{
	text: "3m",
	selected: false
},
{
	text: "15m",
	selected: false
},
{
	text: "30m",
	selected: false
},
{
	text: "1h",
	selected: false
},
{
	text: "2h",
	selected: false
},
{
	text: "4h",
	selected: false
},
{
	text: "6h",
	selected: false
},
{
	text: "12h",
	selected: false
},
{
	text: "1d",
	selected: false
},
{
	text: "3d",
	selected: false
},
{
	text: "1w",
	selected: false
}];

var styles = {
	period: {
		float: "left", 
		padding: "0 5px", 
		margin: "0 5px",
		cursor: "pointer", 
		backgroundColor: "white"
	},
	periodContainer: {
		listStyleType: "none",
		margin: "5px",
		padding: "5px",
		height: "20px"
	},
	chart: {
		backgroundColor: "lightgray",
		float: "left",
		margin: "2px",
		border: "black solid 1px"
	},
	tick: {
		float: "left",
		clear: "both"
	}
}

export default class CexChart extends Component {
	constructor(props) {
		super(props);
		this.state = { 
			ticks: [],
			periods: periodStates,
			currentTickRange: []
		};
	}
	componentDidMount() {
		this.client = this.props.client || new CexWsClient(); 

		this.client.initialOhlcHandler = data => {
			this.setState({
				ticks: data.map(data => {
					return {
						date: new Date(data[0] * 1000),
						open: parseFloat(data[1]),
						high: parseFloat(data[2]),
						low: parseFloat(data[3]),
						close: parseFloat(data[4]),
						volume: 0 //parseFloat(data[5])
					};
				})
			}, this.renderAxis.bind(this));
		};

		this.client.ohlcUpdateHandler = data => {
			if (this.currentPeriod === "1m") {

				var tick = {
					date: new Date(parseFloat(data.time) * 1000),
					open: parseFloat(data.o),
					high: parseFloat(data.h),
					low: parseFloat(data.l),
					close: parseFloat(data.c),
					volume: 0 //parseFloat(data.v)
				};
					
				this.setState({
					ticks: [...this.state.ticks, tick]
				}, this.renderAxis.bind(this));
			}
		}; 

		this.client.initialise();

		this.renderAxis();
	}
	componentWillUnmount() {
		this.client.initialOhlcHandler = () => {};
		this.client.ohlcUpdateHandler = () => {};
	}
	handlePeriodChange(period) {
		this.currentPeriod = period;
		this.state.periods.forEach(item => item.selected = item.text === period);
		this.client.requestOhlcFeed(period);
	}
	renderAxis() {
		this.xScaleAmount = 1;

		var ticks = this.state.ticks;

		this.setState({currentTickRange: ticks });

		var dates = ticks.map(tick => tick.date);
		var minX = dates.sort((a, b) => a - b)[0];
		var maxX = dates.sort((a, b) => b - a)[0];

		var minY = ticks.map(tick => tick.low).sort()[0]
		var maxY = ticks.map(tick => tick.high).sort((a, b) => b - a)[0]

		var xRange = [this.props.padding, this.props.width + this.props.padding];

		this.xScale = d3Scale.scaleTime().domain([minX, maxX]).range(xRange).clamp(true);
		this.yScale = d3Scale.scaleLinear().domain([minY, maxY]).range([this.props.height + this.props.padding, this.props.padding]);

		this.currentXScale = this.xScale;

		this.xAxis = d3Axis.axisBottom(this.xScale);
		this.yAxis = d3Axis.axisLeft(this.yScale);

		this.xAxisEl = d3.select(this.refs.xAxis).call(this.xAxis);
		this.yAxisEl = d3.select(this.refs.yAxis).call(this.yAxis);

		this.zoom = d3.zoom()
			.scaleExtent([1, 20])
			.on("zoom", () => {
				this.xScaleAmount = -d3.event.transform.x;

				var newXAxis = this.xAxis.scale(d3.event.transform.rescaleX(this.xScale))

				this.currentXScale = newXAxis.scale();

				var domain = this.currentXScale.domain();

				var newTickRange = this.state.ticks.filter(tick => tick.date > domain[0] && tick.date < domain[1]);

				this.setState({currentTickRange: newTickRange });

				if (newTickRange.length > 0) {
					//var newMinY = newTickRange.map(tick => tick.low).sort()[0]
					//var newMaxY = newTickRange.map(tick => tick.high).sort((a, b) => b - a)[0]

					//var newYAxis = this.yAxis.scale(this.yScale.domain([newMinY, newMaxY]));

					//this.yAxisEl.call(newYAxis);
					this.xAxisEl.call(newXAxis);
				}
			});

		d3.select(this.refs.selection).call(this.zoom);

	}
	render() {
		var periods = this.state.periods.map((period, index) => {
			var periodStyle = {...styles.period, backgroundColor: period.selected ? "grey" : "white"};

			return <li style={periodStyle} onClick={e => this.handlePeriodChange(period.text)} key={index}>{period.text}</li>
		});

		var wicks = this.state.currentTickRange.map((tick, index) => {
			var x = Math.round(this.currentXScale(tick.date));
			var y1 = this.yScale(tick.high);
			var y2 = this.yScale(tick.low);

			return <path stroke="#000000" style={{color: "black", cursor: "move", pointerEvents: "none"}} key={index} d={`M${x},${y1} L${x},${y2}`}></path>
		})

		var candles = this.state.currentTickRange.map((tick, index) => {
			var x = Math.round(this.currentXScale(tick.date));
			var y = this.yScale(Math.max(tick.open, tick.close));

			var fill = "#00ff00"
			if (tick.open > tick.close) {
				fill = "#ff0000"
			}
			
			var height = Math.max(Math.abs(this.yScale(tick.open) - this.yScale(tick.close)), 3);
			var width = Math.max(this.xScaleAmount * 0.01, 3);
			var xPosition = x - Math.max(this.xScaleAmount * 0.005, 1.5);

			return <rect style={{cursor: "move", pointerEvents: "none"}} key={index} fill={fill} stroke="#000000" width={width} x={xPosition} y={y} height={height}></rect>
		})

		return <div style={styles.chart}>
			<ul style={styles.periodContainer}>{periods}</ul>
			<svg style={{backgroundColor: "white"}} width={this.props.width + this.props.padding * 2} height={this.props.height + this.props.padding * 2 }>
				<g ref="xAxis" transform={"translate(0, " + (this.props.height + this.props.padding) + ")"}></g>
				<g ref="yAxis" transform={"translate(" + this.props.padding + ", " + 0 + ")"}></g>
				<rect ref="selection" width={this.props.width + this.props.padding * 2} 
					height={this.props.height + this.props.padding * 2 } 
					style={{cursor: "move", fill: "none", pointerEvents: "all"}}></rect>
				<g>{wicks}</g>
				<g>{candles}</g>
			</svg>
		</div>
	}
}