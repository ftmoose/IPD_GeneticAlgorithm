import React, { Component } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import GeneticIPD from '../ipd/GeneticIPD';

export class WellKnownTest extends Component {

	state = {
		strategy: "",
		score: null,
	}

	onChange = (e) => {
		if (!e.target.value.match(/^[01]*$/g)) return;
		this.setState({[e.target.name]: e.target.value});
	}

	onSubmit = async (e) => {
		e.preventDefault();
		if (this.state.strategy.length !== 70) return;
		alert('Job starting..');
		let score = await GeneticIPD.test_one_against_wellknown(this.state.strategy);
		alert('Job done.');
		this.setState({score});
	}

	render_score = () => {
		if (!this.state.score) return null;
		return (
			<span>Score: {this.state.score}</span>
		)
	}

	render() {
		return (
			<Card>
				<Card.Header>
					<h5>Test against well known</h5>
				</Card.Header>
				<Card.Body>
					<Form onSubmit={this.onSubmit}>
						<Form.Group>
							<Form.Control type="text" name="strategy" value={this.state.strategy} onChange={this.onChange} required />
						</Form.Group>
						<Button type="submit">Test</Button>
					</Form>
					<br />
					<span style={{fontWeight: "100", opacity: "0.7", fontSize: "0.8em"}}>Only working for mem depth 3</span>
				</Card.Body>
				<Card.Footer>
					{this.render_score()}
				</Card.Footer>
			</Card>
		)
	}
}

export default WellKnownTest;
