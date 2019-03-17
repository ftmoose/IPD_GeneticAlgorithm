import React, { Component } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import GeneticIPD from '../ipd/GeneticIPD';

export class AlgorithmControls extends Component {

	state = {
		generations: "55",
		population_size: "120",
		memory_depth: "3",
		moves_per_game: "150",
		crossover_rate: "0.9",
		mutation_rate: "0.001",
		steady_state: false,
		steady_state_percent: "50",
		select_function: "rank_selection",
		fitness_function: "well_known",
		well_known_choices: {
			"allc": true,
			"alld": true,
			"tft": true,
			"tf2t": true,
			"sus_tft": true,
			"grim": true,
			"rand": true
		}
	}

	onChange = (e) => {
		if (e.target.name === "population_size" || e.target.name === "memory_depth" || e.target.name === "moves_per_game")
			if (!e.target.value.match(/^[0-9]*$/g)) return;
		else if (e.target.name === "crossover_rate" || e.target.name === "mutation_rate")
			if (!e.target.value.match(/^[0-9]*$/g)) return;
		if (e.target.name === "steady_state") this.setState({ [e.target.name]: e.target.checked });
		else this.setState({[e.target.name]: e.target.value});
	}

	onWKCChange = (e) => {
		let wkc = this.state.well_known_choices;
		wkc[e.target.name] = e.target.checked;
		this.setState({well_known_choices: wkc});
	}

	onSubmit = async (e) => {
		e.preventDefault();
		alert('Starting job.');
		let data;
		if (this.state.steady_state){
			data = await GeneticIPD.evolve_steady_state(	this.state.generations,
															this.state.population_size,
															this.state.memory_depth,
															this.state.moves_per_game,
															this.state.crossover_rate,
															this.state.mutation_rate,
															this.state.fitness_function,
															this.state.well_known_choices,
															this.state.select_function,
															this.state.steady_state_percent	);
		}
		else {
			data = await GeneticIPD.evolve(	this.state.generations, 
											this.state.population_size, 
											this.state.memory_depth, 
											this.state.moves_per_game, 
											this.state.crossover_rate, 
											this.state.mutation_rate,
											this.state.fitness_function,
											this.state.well_known_choices,
											this.state.select_function,	);
		}
		let state = this.state;
		this.props.showGraph({data, state});
		alert('Job done.');
	}

	render_wkc() {
		if (this.state.fitness_function !== "well_known") return null;
		return (
			<Form.Group as={Row}>
				<Col sm={12} style={{ textAlign: "left" }}>
					<Form.Check type="checkbox" label="allc" name="allc" checked={this.state.well_known_choices.allc} onChange={this.onWKCChange} />
					<Form.Check type="checkbox" label="alld" name="alld" checked={this.state.well_known_choices.alld} onChange={this.onWKCChange} />
					<Form.Check type="checkbox" label="tft" name="tft" checked={this.state.well_known_choices.tft} onChange={this.onWKCChange} />
					<Form.Check type="checkbox" label="tf2t" name="tf2t" checked={this.state.well_known_choices.tf2t} onChange={this.onWKCChange} />
					<Form.Check type="checkbox" label="sus_tft" name="sus_tft" checked={this.state.well_known_choices.sus_tft} onChange={this.onWKCChange} />
					<Form.Check type="checkbox" label="grim" name="grim" checked={this.state.well_known_choices.grim} onChange={this.onWKCChange} />
					<Form.Check type="checkbox" label="rand" name="rand" checked={this.state.well_known_choices.rand} onChange={this.onWKCChange} />
				</Col>
			</Form.Group>
		)
	}

	render_steady_state_input() {
		if (this.state.steady_state){
			return (
				<Form.Group as={Row}>
					<Form.Label column> State percent: </Form.Label>
					<Col>
						<Form.Control type="text" name="steady_state_percent" value={this.state.steady_state_percent} onChange={this.onChange} required />
					</Col>
				</Form.Group>
			)
		}
		return null;
	}

	render() {
		return (
			<Card>
				<Card.Header>
					<h4>Variables</h4>
				</Card.Header>
				<Card.Body style={{maxHeight: "50vh", overflow: "scroll"}}>

					<Form onSubmit={this.onSubmit}>

						<Form.Group as={Row}>
							<Form.Label column>
								Generations:
							</Form.Label>
							<Col>
								<Form.Control type="text" name="generations" value={this.state.generations} onChange={this.onChange} required/>
							</Col>
						</Form.Group>

						<Form.Group as={Row}>
							<Form.Label column>
								Population size:
							</Form.Label>
							<Col>
								<Form.Control type="text" name="population_size" value={this.state.population_size} onChange={this.onChange} required/>
							</Col>
						</Form.Group>

						<Form.Group as={Row}>
							<Form.Label column>
								Memory depth:
							</Form.Label>
							<Col>
								<Form.Control type="text" name="memory_depth" value={this.state.memory_depth} onChange={this.onChange} required />
							</Col>
						</Form.Group>

						<Form.Group as={Row}>
							<Form.Label column>
								Moves per game:
							</Form.Label>
							<Col>
								<Form.Control type="text" name="moves_per_game" value={this.state.moves_per_game} onChange={this.onChange} required />
							</Col>
						</Form.Group>

						<Form.Group as={Row}>
							<Form.Label column>
								Crossover rate:
							</Form.Label>
							<Col>
								<Form.Control type="text" name="crossover_rate" value={this.state.crossover_rate} onChange={this.onChange} required />
							</Col>
						</Form.Group>

						<Form.Group as={Row}>
							<Form.Label column>
								Mutation rate:
							</Form.Label>
							<Col>
								<Form.Control type="text" name="mutation_rate" value={this.state.mutation_rate} onChange={this.onChange} required />
							</Col>
						</Form.Group>

						<hr />

						<Form.Group as={Row}>
							<Col sm={12} style={{ textAlign: "center" }}>
								<Form.Label>
									<span>Fitness Function</span>
								</Form.Label>
							</Col>
							<Col sm={12}>
								<Form.Control as="select" name="fitness_function" value={this.state.fitness_function} onChange={this.onChange}>
									<option value="population">Against population</option>
									<option value="well_known">Againt well known strategies</option>
								</Form.Control>
							</Col>
						</Form.Group>

						{this.render_wkc()}

						<Form.Group as={Row}>
							<Col sm={12} style={{ textAlign: "center" }}>
								<Form.Label>
									<span>Select Function</span>
								</Form.Label>
							</Col>
							<Col>
								<Form.Control as="select" name="select_function" value={this.state.select_function} onChange={this.onChange}>
									<option value="roulette_wheel_selection">Roulette Wheel Selecion</option>
									<option value="rank_selection">Rank Selection</option>
								</Form.Control>
							</Col>
						</Form.Group>

						<hr />
						<Form.Check type="checkbox" label="steady state" name="steady_state" value={this.state.steady_state} onChange={this.onChange} />
						{this.render_steady_state_input()}

						<hr />

					</Form>
				</Card.Body>
				<Card.Footer>
					<Button onClick={this.onSubmit} style={{ float: "right" }}>evolve</Button>
				</Card.Footer>
			</Card>
		)
	}
}

export default AlgorithmControls;