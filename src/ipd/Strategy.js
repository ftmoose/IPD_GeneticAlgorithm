
class Strategy {
	constructor() {
		this.PAYOFF_MATRIX = [	[3, 0],
								[5, 1]	];
		this.MOVE_MAP = {
			"11": "0",
			"10": "1",
			"01": "2",
			"00": "3",
		}
		this.stratFns = {
			"allc": this.allc,
			"alld": this.alld,
			"tft": this.tft,
			"tf2t": this.tf2t,
			"sus_tft": this.sus_tft,
			"grim": this.grim,
			"rand": this.rand,
		}
	}

	gen_init_history(strat, hist) {
		if (strat === "allc") return Array(hist.length).fill("0");
		if (strat === "alld") return Array(hist.length).fill("1");
		if (strat === "tft") {
			let h = ["0"];
			for (let i = 0; i < hist.length-1; ++i) {
				h.push(hist[i]);
			}
			return h;
		}
		if (strat === "tf2t") {
			let h = ["0", "0"];
			for (let i = 0; i < hist.length-2; ++i) {
				if (hist[i] === "1" && hist[i+1] === "1") h.push("1");
				else h.push("0");
			}
			return h;
		}
		if (strat === "sus_tft") {
			let h = ["1"];
			for (let i = 0; i < hist.length - 1; ++i) {
				h.push(hist[i]);
			}
			return h;
		}
		if (strat === "grim") {
			let h = ["0"];
			let grim = false;
			for (let i = 0; i < hist.length-1; ++i){
				if (hist[i] === "1") grim = true;
				if (grim) h.push("1");
				else h.push("0");
			}
			return h;
		}
		if (strat === "rand") {
			let h = [];
			for (let i = 0; i < hist.length; ++i){
				h.push(""+Math.round(Math.random()));
			}
			return h;
		}
	}

	get_history(A, memd) {
		let hist_len = memd*2;
		let hist = []
		for (let i = 0; i < hist_len; i += 2){
			hist.push(A[i]);
		}
		return hist;
	}

	toBase4(str) {
		let base4str = "";
		for (let i = 0; i < str.length; i += 2) {
			base4str += this.MOVE_MAP[ str.substring(i, i+2) ];
		}

		let decimal = 0;
		for (let i = 0; i < base4str.length; ++i) {
			decimal += parseInt(base4str[i]) * Math.pow(4, base4str.length - i - 1);
		}

		return decimal;
	}

	play(A, memd, limit, strat) {
		return new Promise((resolve, reject) => {
			let score = 0;
			let A_history = this.get_history(A, memd);
			let B_history = this.gen_init_history(strat, A_history);
			while (limit > 0) {
				let hist_str = "";
				for (let i = A_history.length - memd; i < A_history.length; ++i)
					hist_str += A_history[i] + "" + B_history[i];

				let A_next_move = A[this.toBase4(hist_str)];
				let B_next_move = this.stratFns[strat](A_history);

				A_history.push(A_next_move);
				B_history.push(B_next_move);

				score += this.PAYOFF_MATRIX[A_next_move][B_next_move];
				limit--;
			}

			resolve(score);
		});
	}
	play_default(A, memd, limit, wkc) {
		let strats = new Set(Object.keys(wkc).filter(x => wkc[x]));
		let count = 0;
		let score = 0;
		return new Promise(resolve => {
			for (let strat of strats){
				this.play(A, memd, limit, strat)
					// eslint-disable-next-line
					.then(res => {
						score += res;
						count++;
						if (count === strats.size){
							resolve(score / count);
						}
					})
					.catch(err => console.log(err));
			}
		});
	}

	allc(h) {
		return "0"
	}

	alld(h) {
		return "1"
	}

	tft(h) {
		let history = [...h];
		let last_move = history.pop();
		if (last_move === "1") {
			return "1";
		}
		return "0";
	}

	tf2t(h) {
		let history = [...h];
		let last_move = history.pop()[0];
		let second_last_move = history.pop()[0];
		if (last_move === "1" && second_last_move === "1"){
			return "1";
		}
		return "0";
	}

	sus_tft(h) {
		let history = [...h];
		let last_move = history.pop();
		if (last_move === "1") {
			return "1";
		}
		return "0";
	}

	grim(h) {
		let history = [...h];
		if (history.indexOf("1") !== -1) return "1";
		return "0";
	}

	rand(h) {
		return Math.round(Math.random())+"";
	}
}

export default new Strategy();