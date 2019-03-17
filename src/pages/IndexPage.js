import React, { Component } from 'react';
import { Row, Col, Card, Container, Button } from 'react-bootstrap';
import AlgorithmControls from '../components/AlgorithmControls';
import Dygraph from 'dygraphs';
import { CSVLink } from "react-csv";
import CSVReader from 'react-csv-reader'

export class IndexPage extends Component {

	state = {
		data_csv: "",
		algo_settings: {},
		title: null,
		best_strategy: null,
	}

	showGraph = async (res) => {
		let data_csv = "Generation,Best,Avg,Worst\n";
		let data = res.data;
		this.setState({ algo_settings: res.state });
		await this.setState({ best_strategy: data.final });
		console.log(data)
		for (let key in data) {
			if (!parseInt(key)) continue;
			data_csv += `${key},${data[key].best},${data[key].avg},${data[key].worst}\n`
		}
		this.setState({data_csv});
		this.setState({title: null});
		this.renderGraph(data_csv);
	}

	showGraphFromImport = (data, title) => {
		data = data.map(item => item.join(','));
		data = data.join('\n');
		this.setState({best_strategy: null});
		this.setState({title});
		this.renderGraph(data);
	}

	renderGraph = (csv) => {
		new Dygraph(document.getElementById("graphdiv"), csv, {
			visibility: [true, true, true],
			drawAxesAtZero: true,
			includeZero: true,
			drawPoints: true,
			legend: "always"
		})
	}

	render_export_link = () => {
		if (this.state.data_csv.length > 0){
			let s = this.state.algo_settings
			let filename = "";
			filename += s.generations+"_"+s.population_size+"_";
			filename += s.memory_depth+"_"+s.moves_per_game+"_";
			filename += s.crossover_rate+"_"+s.mutation_rate;
			if (s.steady_state) filename += "_"+s.steady_state_percent;
			filename += ".csv";
			return <CSVLink data={this.state.data_csv} filename={filename}> Export </CSVLink>
		}
		return null;
	}

	render_title = () => {
		if (this.state.title)
			return <h4>{this.state.title}</h4>;
		return null;
	}

	handleImportError = () => {
		alert('could not import file!');
	}


	render_best_strategy_title = () => {
		if (this.state.best_strategy)
			return (
				<div>
					<h5>Results</h5>
				</div>
			);

		return null;
	}
	render_best_strategy = () => {
		if (this.state.best_strategy)
			return (
				<div>
					<span>Strategy: {this.state.best_strategy.strategy}</span><br />
					<span>Score: {parseFloat(this.state.best_strategy.score.toFixed(2))}</span>
				</div>
			);

		return null;
	}

	render() {
		return (
			<div>
				<Container>
					<Row style={{marginTop: "1em", justifyContent: "center"}}>
						<Card>
							<Card.Body>
								<h5>Using Genetic Algorithms to Develop Optimal Solutions to the Iterated Prisoner's Dilemma</h5>
							</Card.Body>
						</Card>
					</Row>
					<br />
					<Row>
						<Col sm={12} lg={4}>
							<AlgorithmControls 
								showGraph={this.showGraph}
							/>
							<br />
							<Card>
								<Card.Body>
									<CSVReader
										cssClass="csv-reader-input"
										label="Import a file."
										onFileLoaded={this.showGraphFromImport}
										onError={this.handleImportError}
										inputStyle={{ color: 'red' }}
									/>
								</Card.Body>
							</Card>
							<br />
						</Col>
						<Col sm={12} lg={8}>
							<Card style={{ justifyContent: "center" }}>
								<Card.Header>
									{this.render_title()}
								</Card.Header>
								<Card.Body>
									<div id="graphdiv" style={{width: "100%"}} ></div>
								</Card.Body>
								<Card.Footer>
									{this.render_export_link()}
								</Card.Footer>
							</Card>
							<br />
							<Card>
								<Card.Header>
									{this.render_best_strategy_title()}
								</Card.Header>
								<Card.Body>
									{this.render_best_strategy()}
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Container>
			</div>
		)
	}
}

export default IndexPage;