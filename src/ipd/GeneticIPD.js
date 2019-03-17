/*
	GA to develop optimal strategies for IPD
	
	Mostapha Rammo
*/

import Strategy from './Strategy';

// defect - rat out (1)
// cooperate - stay silent (0)

// when looking at a history (i.e: 01) the first char is strategies move

class GeneticIPD {
	constructor() {
		this.P = 1;		// PUNISHMENT - both defect
		this.R = 3;		// REWARD - both cooperate
		this.S = 0;		// SUCKER - cooperate but opponent defects
		this.T = 5;		// TEMPTATION - defects and opponent cooperates

		this.POPULATION_SIZE = 16;
		this.MEMORY_DEPTH = 3;
		this.MOVES_PER_GAME = 150;
		this.PAYOFF_MATRIX = [	[this.R, this.S], 
								[this.T, this.P] ];
		this.BENCHMARK_SCORE = this.PAYOFF_MATRIX[0][0] * this.MOVES_PER_GAME;
		this.MOVE_MAP = {
			"11": "0",
			"10": "1",
			"01": "2",
			"00": "3",
		}
		this.CROSSOVER_RATE = 0.9;
		this.MUTATION_RATE = 1/(Math.pow(2, this.MEMORY_DEPTH * 2) + this.MEMORY_DEPTH * 2);
		this.FITNESS_FUNCTION = this.calculate_population_fitnesses;
		this.SELECT_FUNCTION = this.roulette_wheel_selection;
		this.WKC = {
			"allc": true,
			"alld": true,
			"tft": true,
			"tf2t": true,
			"sus_tft": true,
			"grim": true,
			"rand": true
		};
	}

	generate_random_population(population=[]) {
		let chromosome_size = Math.pow(2, this.MEMORY_DEPTH * 2) + this.MEMORY_DEPTH * 2;

		for (let i = population.length; i < this.POPULATION_SIZE; ++i) {
			let chromosome;

			chromosome = "";
			for (let j = 0; j < chromosome_size; ++j) {
				chromosome += Math.round(Math.random());
			}
			
			population.push(chromosome);
		}
		
		return population;
	}

	get_next_move(strategy, history) {
		// remove history from strategy
		strategy = strategy.substring(this.MEMORY_DEPTH * 2);
		
		// get next move index from history
		let new_history = "";
		for (let i = 0; i < history.length; ++i){
			new_history += this.MOVE_MAP[history[i]];
		}
		
		// convert base 4 to decimal
		let decimal = 0;
		for (let i = 0; i < new_history.length; ++i) {
			decimal += parseInt(new_history[i]) * Math.pow(4, new_history.length-i-1);
		}

		return parseInt(strategy[decimal]);
	}

	/*
		plots two strategies against each other for MOVES_PER_GAME times,
		returns total game score for first parameter
	*/
	play_game(A, B) {
		let A_score = 0;
		let B_score = 0;
		let A_history = [];
		let B_history = [];

		// get initial history
		for (let i = 0; i < this.MEMORY_DEPTH * 2; i += 2){
			A_history.push(A.substring(i, i+2));
			B_history.push(B.substring(i, i+2));
		}
		
		// calculate total score
		for (let i = 0; i < this.MOVES_PER_GAME; ++i) {
			let A_next = this.get_next_move(A, B_history);
			let B_next = this.get_next_move(B, A_history);

			A_score += this.PAYOFF_MATRIX[A_next][B_next];
			B_score += this.PAYOFF_MATRIX[B_next][A_next];

			// update history
			A_history.shift();
			A_history.push(""+A_next+B_next);
			B_history.shift();
			B_history.push(""+B_next+A_next);
		}

		return [A_score, B_score];
	}

	/*
		each chromosome in the population plays against every other including itself
	*/
	calculate_population_fitnesses(population) {
		let population_scores = {};
		let cached_scores = {};
		for (let i = 0; i < population.length; ++i){
			if (population_scores[population[i]]) continue;
			population_scores[population[i]] = 0;

			// sum up scores from games against each other opponent
			for (let j = 0; j < population.length; ++j){
				if (cached_scores[`${population[i]}/${population[j]}`]){
					population_scores[population[i]] += cached_scores[`${population[i]}/${population[j]}`][0];
					continue;
				}
				if (cached_scores[`${population[j]}/${population[i]}`]) {
					population_scores[population[i]] += cached_scores[`${population[j]}/${population[i]}`][1];
					continue;
				}
				let scores;
				scores = this.play_game(population[i], population[j]);
				cached_scores[`${population[i]}/${population[j]}`] = scores;
				cached_scores[`${population[j]}/${population[i]}`] = [scores[1], scores[0]];
				population_scores[population[i]] += scores[0];
			}

			// average out the sum by dividing by total opponents
			population_scores[population[i]] /= population.length;

			// normalize score by comparing to benchmark score
			population_scores[population[i]] /= this.BENCHMARK_SCORE;
		}

		return population_scores;
	}

	/*
		score each chromosome in the population by pitting against well known strategies
	*/
	calculate_population_fitnesses_wkc(population) {
		let values_left = population.length;
		return new Promise(resolve => {
			let fitnesses = {};
			for (let i = 0; i < population.length; ++i) {
				Strategy.play_default(population[i], this.MEMORY_DEPTH, this.MOVES_PER_GAME, this.WKC)
					// eslint-disable-next-line
					.then(res => {
						fitnesses[population[i]] = res/this.BENCHMARK_SCORE;
						values_left--;
						if (values_left === 0)
							resolve(fitnesses);
					})
			}
		});
	}

	steady_state_population(fitnesses, size){
		let fs = Object.assign({}, fitnesses);
		let pop = [];
		for (let i = 0; i < size; ++i){
			let p = this.get_most_fit(fs).strategy;
			pop.push(p);
			delete fs[p];
		}
		return pop;
	}


	roulette_wheel_selection(fitnesses) {
		let S = 0;
		for (let strategy in fitnesses)
			S += fitnesses[strategy];
		
		let r = Math.random() * S;
		let s = 0;
		for (let strategy in fitnesses) {
			s += fitnesses[strategy];
			if (s > r) return strategy;
		}
	}

	rank_selection = (fitnesses) => {
		// rank fitnesses
		let fs = Object.assign({}, fitnesses);
		let sorted_desc = [];
		while(sorted_desc.length < Object.keys(fs).length){
			let x = this.get_most_fit(fs).strategy;
			sorted_desc.push(x);
			delete fs[x];
		}
		let ranked = {};
		let buf = 0;
		for (let i = 0; i < sorted_desc.length; ++i){
			if (ranked[sorted_desc[i]]) {
				buf++;
				continue;
			}

			ranked[sorted_desc[i]] = sorted_desc.length - i + buf;
		}


		return this.roulette_wheel_selection(ranked);
	}

	get_most_fit(fitnesses) {
		let most_fit;
		let largest = -1;
		for (let strategy in fitnesses){
			if (fitnesses[strategy] > largest){
				largest = fitnesses[strategy];
				most_fit = strategy;
			}
		}
		return {
			strategy: most_fit,
			score: largest,
		};
	}

	get_least_fit(fitnesses) {
		let least_fit;
		let lowest = 100000000;
		for (let strategy in fitnesses) {
			if (fitnesses[strategy] < lowest) {
				lowest = fitnesses[strategy];
				least_fit = strategy;
			}
		}
		return {
			strategy: least_fit,
			score: lowest,
		};
	}

	get_avg_fitness(fitnesses) {
		let sum = 0;
		let cnt = 0;
		for (let strategy in fitnesses){
			sum += fitnesses[strategy];
			cnt++;
		}
		return sum/cnt;
	}

	find_parents(fitnesses, algorithm=this.roulette_wheel_selection, num_parents=2) {
		let fs = Object.assign({}, fitnesses);
		let parents = [];
		for (let i = 0; i < num_parents; ++i){
			//let p = this.get_most_fit(fitnesses).strategy;
			let p = algorithm(fs);
			parents.push(p);
			delete fs[p];
		}
		return parents;
	}

	crossover(A, B) {
		// return same strategies if no crossover
		if (Math.random() > this.CROSSOVER_RATE) return [A, B];
		//let split_position = (this.MEMORY_DEPTH * 2) + Math.floor(Math.random() * Math.pow(2, this.MEMORY_DEPTH * 2));
		let split_position = Math.floor(Math.random() * (Math.pow(2, this.MEMORY_DEPTH * 2) + (this.MEMORY_DEPTH*2)));
		//A = A.substring(0, this.MEMORY_DEPTH * 2) + B.substring(this.MEMORY_DEPTH * 2, split_position) + A.substring(split_position);
		//B = B.substring(0, this.MEMORY_DEPTH * 2) + A.substring(this.MEMORY_DEPTH * 2, split_position) + B.substring(split_position);
		let A_old = A;
		A = A.substring(0, split_position) + B.substring(split_position);
		B = B.substring(0, split_position) + A_old.substring(split_position);
		return [A, B];
	}

	mutate(A) {
		for (let i = 0; i < A.length; ++i) {
			if (Math.random() > this.MUTATION_RATE) continue;
			A = A.substring(0, i) + ((A[i] === "0") ? "1" : "0") + A.substring(i+1);
		}
		return A;
	}

	/*
		run GA
	*/
	async evolve(num_gen, pop_size=16, mem_depth=3, mpg=150, cx_rate=0.9, mut_rate=0.014, fitness_function="population", wkc, select_function="roulette_wheel_selection") {

		this.POPULATION_SIZE = pop_size;
		this.MEMORY_DEPTH = mem_depth;
		this.MOVES_PER_GAME = mpg;
		this.CROSSOVER_RATE = cx_rate;
		this.MUTATION_RATE = mut_rate;
		this.BENCHMARK_SCORE = this.PAYOFF_MATRIX[0][0] * this.MOVES_PER_GAME;
		if (fitness_function === "well_known") this.FITNESS_FUNCTION = this.calculate_population_fitnesses_wkc;
		else this.FITNESS_FUNCTION = this.calculate_population_fitnesses;
		this.WKC = wkc;
		if (select_function === "rank_selection") this.SELECT_FUNCTION = this.rank_selection;
		else this.SELECT_FUNCTION = this.roulette_wheel_selection;

		let generations = {};
		let best_strategy;
		let population = this.generate_random_population();
		for (let g = 0; g < num_gen; ++g) {
			console.log("generation: ",g);
			let fitnesses = await this.FITNESS_FUNCTION(population);
			best_strategy = this.get_most_fit(fitnesses);
			let average_fitness = this.get_avg_fitness(fitnesses);
			generations[g] = {
				best: parseFloat(best_strategy.score.toFixed(2)),
				avg: parseFloat(average_fitness.toFixed(2)),
				worst: parseFloat(this.get_least_fit(fitnesses).score.toFixed(2)),
			}

			population = []
			while(population.length < this.POPULATION_SIZE) {
				let parents = this.find_parents(fitnesses, this.SELECT_FUNCTION);
				let children = this.crossover(parents[0], parents[1]);
				children[0] = this.mutate(children[0]);
				children[1] = this.mutate(children[1]);
				population.push(...children);
			}
		}

		generations.final = best_strategy;
		return generations;
	}


	async evolve_steady_state(num_gen, pop_size = 16, mem_depth = 3, mpg = 150, cx_rate = 0.9, mut_rate = 0.014, fitness_function="population", wkc, select_function="roulette_wheel_selection", state_percent=50) {
		this.POPULATION_SIZE = pop_size;
		this.MEMORY_DEPTH = mem_depth;
		this.MOVES_PER_GAME = mpg;
		this.CROSSOVER_RATE = cx_rate;
		this.MUTATION_RATE = mut_rate;
		this.BENCHMARK_SCORE = this.PAYOFF_MATRIX[0][0] * this.MOVES_PER_GAME;
		if (fitness_function === "well_known") this.FITNESS_FUNCTION = this.calculate_population_fitnesses_wkc;
		else this.FITNESS_FUNCTION = this.calculate_population_fitnesses;
		this.WKC = wkc;
		if (select_function === "rank_selection") this.SELECT_FUNCTION = this.rank_selection;
		else this.SELECT_FUNCTION = this.roulette_wheel_selection;

		let generations = {};
		let best_strategy;
		let population = this.generate_random_population();

		for (let g = 0; g < num_gen; ++g) {
			console.log("generation: ", g);

			let fitnesses = await this.FITNESS_FUNCTION(population);
			best_strategy = this.get_most_fit(fitnesses);
			let average_fitness = this.get_avg_fitness(fitnesses);
			generations[g] = {
				best: parseFloat(best_strategy.score.toFixed(2)),
				avg: parseFloat(average_fitness.toFixed(2)),
				worst: parseFloat(this.get_least_fit(fitnesses).score.toFixed(2)),
			}

			let init_pop = this.steady_state_population(fitnesses, Math.floor((state_percent/100)*this.POPULATION_SIZE) );
			population = [...init_pop];
			while (population.length < this.POPULATION_SIZE) {
				let parents = this.find_parents(fitnesses, this.SELECT_FUNCTION);

				let children = this.crossover(parents[0], parents[1]);
				children[0] = this.mutate(children[0]);
				children[1] = this.mutate(children[1]);
				population.push(...children);
			}
		}
		generations.final = best_strategy;
		return generations;
	}
}

export default new GeneticIPD();
