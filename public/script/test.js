//'use strict';

let startTime; // beginning of first touch

let participantID;
let blockno;

const blockLimit = 4;
const checkpointStart = document.getElementById('checkpoint1');
const checkpointFinal = document.getElementById('checkpointE');
const checkpointPairs = [
	[document.getElementById('checkpointA'), document.getElementById('checkpoint2Fake')],
	[document.getElementById('checkpoint2'), document.getElementById('checkpointBFake')],
	[document.getElementById('checkpointB'), document.getElementById('checkpoint3Fake')],
	[document.getElementById('checkpoint3'), document.getElementById('checkpointCFake')],
	[document.getElementById('checkpointC'), document.getElementById('checkpoint4Fake')],
	[document.getElementById('checkpoint4'), document.getElementById('checkpointDFake')],
	[document.getElementById('checkpointD'), document.getElementById('checkpoint5Fake')],
	[document.getElementById('checkpoint5'), document.getElementById('checkpointEFake')]
];
let phase = -1; // represents which checkpoint is next: -1 = 1, 0 = A, 1 = 2, 2 = B, etc to work nicely with the checkpointPairs array
let error = false; // if in error state
// this is an array of arrays of coordinates.
const coords = [];
//let blockno = 1;

const getIDBlock = async function () {
	const response = await fetch('/calculateResult');
	const data = await response.json(); // Correct way to parse JSON
	return data;
}

//console.log(participantID);
//console.log(blockno);
let end = 0;

function currentTime() {
	return Date.now() - startTime;
}


function placePoints(pair) {
	let currentRect
	if (pair == 0) {
		currentRect = checkpointStart.getBoundingClientRect();
	} else {
		checkpointPairs[pair - 1][0].style.display = 'flex';
		currentRect = checkpointPairs[pair - 1][0].getBoundingClientRect(); // this function only works on visible things, so i have to turn on display before i get the rect to make it work; this is stupid
		checkpointPairs[pair - 1][0].style.display = 'none';
	}
	let rectA = new DOMRect(0, 0, 80, 80);
	let rectB = new DOMRect(0, 0, 80, 80);
	do {
		if (window.innerWidth > window.innerHeight) { // place in quadrants corresponding to current point
			if (pair == 0) { // startpoint
				rectA.y = 10 + Math.random() * (window.innerHeight / 2 - 100); // top
				rectA.x = 10 + Math.random() * (window.innerWidth / 2 - 100); // left
				rectB.y = 10 + Math.random() * (window.innerHeight / 2 - 100); // top
				rectB.x = window.innerWidth / 2 + 10 + Math.random() * (window.innerWidth / 2 - 100); // right
			} else if (currentRect.x < window.innerWidth / 2 && currentRect.y < window.innerHeight / 2) { // top left quadrant
				rectA.y = 10 + Math.random() * (window.innerHeight / 2 - 100); // top
				rectA.x = window.innerWidth / 2 + Math.random() * (window.innerWidth / 2 - 100); // right
				rectB.y = window.innerHeight / 2 + 10 + Math.random() * (window.innerHeight / 2 - 100); // bottom
				rectB.x = Math.random() > 1 / 2 ? 10 + Math.random() * (window.innerWidth / 2 - 100) : window.innerWidth / 2 + 10 + Math.random() * (window.innerWidth / 2 - 100); // left or right
			} else if (currentRect.x > window.innerWidth / 2 && currentRect.y < window.innerHeight / 2) { // top right
				rectA.y = 10 + Math.random() * (window.innerHeight / 2 - 100); // top
				rectA.x = 10 + Math.random() * (window.innerWidth / 2 - 100); // left
				rectB.y = window.innerHeight / 2 + 10 + Math.random() * (window.innerHeight / 2 - 100); // bottom
				rectB.x = Math.random() > 1 / 2 ? 10 + Math.random() * (window.innerWidth / 2 - 100) : window.innerWidth / 2 + 10 + Math.random() * (window.innerWidth / 2 - 100); // left or right
			} else if (currentRect.x < window.innerWidth / 2 && currentRect.y > window.innerHeight / 2) { // bottom left
				rectA.y = window.innerHeight / 2 + 10 + Math.random() * (window.innerHeight / 2 - 100); // bottom
				rectA.x = window.innerWidth / 2 + Math.random() * (window.innerWidth / 2 - 100); // right
				rectB.y = 10 + Math.random() * (window.innerHeight / 2 - 100); // top
				rectB.x = Math.random() > 1 / 2 ? 10 + Math.random() * (window.innerWidth / 2 - 100) : window.innerWidth / 2 + 10 + Math.random() * (window.innerWidth / 2 - 100); // left or right
			} else if (currentRect.x > window.innerWidth / 2 && currentRect.y > window.innerHeight / 2) { // bottom right
				rectA.y = window.innerHeight / 2 + 10 + Math.random() * (window.innerHeight / 2 - 100); // bottom
				rectA.x = 10 + Math.random() * (window.innerWidth / 2 - 100); // left
				rectB.y = 10 + Math.random() * (window.innerHeight / 2 - 100); // top
				rectB.x = Math.random() > 1 / 2 ? 10 + Math.random() * (window.innerWidth / 2 - 100) : window.innerWidth / 2 + 10 + Math.random() * (window.innerWidth / 2 - 100); // left or right
			} else { // something went wrong
				throw new Error('cannot find current point');
			}
		} else {
			if (pair == 0) { // startpoint
				rectA.x = 10 + Math.random() * (window.innerWidth / 2 - 100); // left
				rectA.y = 10 + Math.random() * (window.innerHeight / 2 - 100); // top
				rectB.x = window.innerWidth / 2 + 10 + Math.random() * (window.innerWidth / 2 - 100); // right
				rectB.y = 10 + Math.random() * (window.innerHeight / 2 - 100); // top
			} else if (currentRect.x < window.innerWidth / 2 && currentRect.y < window.innerHeight / 2) { // top left quadrant
				rectA.x = 10 + Math.random() * (window.innerWidth / 2 - 100); // left
				rectA.y = window.innerHeight / 2 + 10 + Math.random() * (window.innerHeight / 2 - 100); // bottom
				rectB.x = window.innerWidth / 2 + 10 + Math.random() * (window.innerWidth / 2 - 100); // right
				rectB.y = Math.random() > 1 / 2 ? 10 + Math.random() * (window.innerHeight / 2 - 100) : window.innerHeight / 2 + 10 + Math.random() * (window.innerHeight / 2 - 100); // top or bottom
			} else if (currentRect.x > window.innerWidth / 2 && currentRect.y < window.innerHeight / 2) { // top right
				rectA.x = window.innerWidth / 2 + Math.random() * (window.innerWidth / 2 - 100); // right
				rectA.y = window.innerHeight / 2 + 10 + Math.random() * (window.innerHeight / 2 - 100); // bottom
				rectB.x = 10 + Math.random() * (window.innerWidth / 2 - 100); // left
				rectB.y = Math.random() > 1 / 2 ? 10 + Math.random() * (window.innerHeight / 2 - 100) : window.innerHeight / 2 + 10 + Math.random() * (window.innerHeight / 2 - 100); // top or bottom
			} else if (currentRect.x < window.innerWidth / 2 && currentRect.y > window.innerHeight / 2) { // bottom left
				rectA.x = 10 + Math.random() * (window.innerWidth / 2 - 100); // left
				rectA.y = 10 + Math.random() * (window.innerHeight / 2 - 100); // top
				rectB.x = window.innerWidth / 2 + 10 + Math.random() * (window.innerWidth / 2 - 100); // right
				rectB.y = Math.random() > 1 / 2 ? 10 + Math.random() * (window.innerHeight / 2 - 100) : window.innerHeight / 2 + 10 + Math.random() * (window.innerHeight / 2 - 100); // top or bottom
			} else if (currentRect.x > window.innerWidth / 2 && currentRect.y > window.innerHeight / 2) { // bottom right
				rectA.x = window.innerWidth / 2 + Math.random() * (window.innerWidth / 2 - 100); // right
				rectA.y = 10 + Math.random() * (window.innerHeight / 2 - 100); // top
				rectB.x = 10 + Math.random() * (window.innerWidth / 2 - 100); // left
				rectB.y = Math.random() > 1 / 2 ? 10 + Math.random() * (window.innerHeight / 2 - 100) : window.innerHeight / 2 + 10 + Math.random() * (window.innerHeight / 2 - 100); // top or bottom
			} else { // something went wrong
				throw new Error('cannot find current point');
			}
		}


	} while ( // insure points are more than 15 degrees apart
		Math.abs(Math.atan2(currentRect.y - rectB.y, currentRect.x - rectB.x) * 180 / Math.PI - Math.atan2(currentRect.y - rectA.y, currentRect.x - rectA.x) * 180 / Math.PI) < 15
	)

	if (pair < checkpointPairs.length) {
		if (Math.random() > 0.5) { // Coin flip whether A or B is next
			checkpointPairs[pair][0].style.left = `${rectA.x}px`;
			checkpointPairs[pair][0].style.top = `${rectA.y}px`;
			checkpointPairs[pair][1].style.left = `${rectB.x}px`;
			checkpointPairs[pair][1].style.top = `${rectB.y}px`;
		} else {
			checkpointPairs[pair][0].style.left = `${rectB.x}px`;
			checkpointPairs[pair][0].style.top = `${rectB.y}px`;
			checkpointPairs[pair][1].style.left = `${rectA.x}px`;
			checkpointPairs[pair][1].style.top = `${rectA.y}px`;
		}
	} else {
		if (Math.random > 0.5) {
			checkpointFinal.style.left = `${rectA.x}px`;
			checkpointFinal.style.top = `${rectA.y}px`;
		} else {
			checkpointFinal.style.left = `${rectA.x}px`;
			checkpointFinal.style.top = `${rectA.y}px`;
		}
	}
}



function endblock() {
	console.log("endblock");
	var data = { // create data object
		patientid: [],
		blockno: [],
		coordx: [],
		coordy: [],
		coordt: [],
		realpointid: [],
		realpointx: [],
		realpointy: [],
		fakepointid: [],
		fakepointx: [],
		fakepointy: [],
		speed: [],
		pause: [],
		correctangle: [],
		wrongangle: [],
		error: [],
		errorcorrected: [],
	};
	blockno = blockno + 1;
	console.log(blockno);
	for (const coord of coords) { // add coords to data object
		data.patientid.push(participantID);
		data.blockno.push(blockno);
		data.coordx.push(coord[0]);
		data.coordy.push(coord[1]);
		data.coordt.push(coord[2]);
		data.realpointid.push(coord[3]);
		data.realpointx.push(coord[4]);
		data.realpointy.push(coord[5]);
		data.fakepointid.push(coord[6]);
		data.fakepointx.push(coord[7]);
		data.fakepointy.push(coord[8]);
	}

	//console.log(coords);

	data = calculate_measures(coords, data);


	//console.log(data); // TODO log data (debugging, remove later)

	fetch("/submitdata", { // send data to server
		method: "POST",
		headers: {
			"Content-Type": "application/json", // as json
		},
		body: JSON.stringify(data), // body is stringified json
	});
	if (blockno === blockLimit) {
		document.getElementById("resultsModal").style.display = 'block';
	}
	else {
		document.getElementById("restartsModal").style.display = 'block';
	}
}

getIDBlock().then(data => {
	console.log(data); // Logs the data after the promise is resolved
	participantID = data.participantID;
	blockno = data.blockno;

	if (blockno === blockLimit) {
		participantID = participantID + 1;
		blockno = 0;
	}

	for (let pair in [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
		placePoints(pair); // this generates the locations of all of the points ahead of time
	}

	// At the touch start
	document.addEventListener("touchstart", e => {
		if (coords.length == 0) {
			startTime = Date.now(); // if first touch, set startTime
		}

		// add point to coords
		const touch = e.changedTouches[0];

		// Advance phase if starting on startpoint or previous with in error state
		if (!error && document.elementsFromPoint(touch.pageX, touch.pageY).includes(checkpointStart) && phase == -1) {
			phase++;
			checkpointPairs[phase][0].style.display = 'flex';
			checkpointPairs[phase][1].style.display = 'flex';
		} else if (error && document.elementsFromPoint(touch.pageX, touch.pageY).includes(phase > -1 ? checkpointPairs[phase][0] : checkpointStart)) {
			if (phase < checkpointPairs.length - 1) {
				phase++;
				checkpointPairs[phase][0].style.display = 'flex';
				checkpointPairs[phase][1].style.display = 'flex';
			}
			else {
				checkpointPairs[phase][0].style.display = 'flex';
				checkpointFinal.style.display = 'flex';
				phase++;
			}
			error = false;
		}

		if (phase > -1 && phase < checkpointPairs.length) {
			coords.push([touch.screenX, touch.screenY, currentTime(), checkpointPairs[phase][0].id, checkpointPairs[phase][0].getBoundingClientRect().x, checkpointPairs[phase][0].getBoundingClientRect().y, checkpointPairs[phase][1].id, checkpointPairs[phase][1].getBoundingClientRect().x, checkpointPairs[phase][1].getBoundingClientRect().y]);
		}

	});

	document.addEventListener("touchmove", e => {
		const touch = e.changedTouches[0];

		// Advance phase if on correct point, show error message if not
		if (!error && document.elementsFromPoint(touch.pageX, touch.pageY).includes(phase < checkpointPairs.length ? checkpointPairs[phase][0] : checkpointFinal)) {
			phase++;
			checkpointStart.style.display = 'none';
			if (phase < checkpointPairs.length) { // middle point
				checkpointPairs[phase][0].style.display = 'flex';
				checkpointPairs[phase][1].style.display = 'flex';
				coords.push([touch.screenX, touch.screenY, currentTime(), checkpointPairs[phase][0].id, checkpointPairs[phase][0].getBoundingClientRect().x, checkpointPairs[phase][0].getBoundingClientRect().y, checkpointPairs[phase][1].id, checkpointPairs[phase][1].getBoundingClientRect().x, checkpointPairs[phase][1].getBoundingClientRect().y]); // add point to coords
			} else if (phase == checkpointPairs.length) { // last point
				checkpointFinal.style.display = 'flex'
				coords.push([touch.screenX, touch.screenY, currentTime(), checkpointFinal.id, checkpointFinal.getBoundingClientRect().x, checkpointFinal.getBoundingClientRect().y, 'none', -1, -1]); // add point to coords
			}
			if (phase > 0 && phase - 1 < checkpointPairs.length) {
				checkpointPairs[phase - 1][1].style.display = 'none';
			}
			if (phase > 1 && phase - 2 < checkpointPairs.length) {
				checkpointPairs[phase - 2][0].style.display = 'none';
			}

			if (end === 0 && document.elementsFromPoint(touch.pageX, touch.pageY).includes(checkpointFinal)) {
				end = 1;
				endblock();
			}

		} else if (!error && document.elementsFromPoint(touch.pageX, touch.pageY).includes(phase < checkpointPairs.length ? checkpointPairs[phase][1] : null)) {
			coords.push([-2, -2, -2, checkpointPairs[phase][0].id, checkpointPairs[phase][0].getBoundingClientRect().x, checkpointPairs[phase][0].getBoundingClientRect().y, checkpointPairs[phase][1].id, checkpointPairs[phase][1].getBoundingClientRect().x, checkpointPairs[phase][1].getBoundingClientRect().y]);
			document.getElementById("errorModal").style.display = 'block'; // show error modal
			checkpointPairs[phase][0].style.display = 'none';
			checkpointPairs[phase][1].style.display = 'none';
			phase--; // force user to go back
			error = true; // set error state
		}
		else {
			if (phase < checkpointPairs.length) { // middle point
				coords.push([touch.screenX, touch.screenY, currentTime(), checkpointPairs[phase][0].id, checkpointPairs[phase][0].getBoundingClientRect().x, checkpointPairs[phase][0].getBoundingClientRect().y, checkpointPairs[phase][1].id, checkpointPairs[phase][1].getBoundingClientRect().x, checkpointPairs[phase][1].getBoundingClientRect().y]); // add point to coords
			} else if (phase == checkpointPairs.length) { // last point
				coords.push([touch.screenX, touch.screenY, currentTime(), checkpointFinal.id, checkpointFinal.getBoundingClientRect().x, checkpointFinal.getBoundingClientRect().y, 'none', -1, -1]); // add point to coords
			}
		}
		//console.log(currentTime());
	});

	document.addEventListener("touchend", e => {
		// add point to coords
		const touch = e.changedTouches[0];

		//console.log(currentTime());

		if (end === 0 && document.elementsFromPoint(touch.pageX, touch.pageY).includes(checkpointFinal)) { // if at final point, submit data
			end = 1;
			endblock();
		}
		else {
			if (!error && end === 0) {
				if (phase < checkpointPairs.length) {
					coords.push([-1, -1, -1, checkpointPairs[phase][0].id, checkpointPairs[phase][0].getBoundingClientRect().x, checkpointPairs[phase][0].getBoundingClientRect().y, checkpointPairs[phase][1].id, checkpointPairs[phase][1].getBoundingClientRect().x, checkpointPairs[phase][1].getBoundingClientRect().y]);
					document.getElementById("liftModal").style.display = 'block'; // show error modal
					checkpointPairs[phase][0].style.display = 'none';
					checkpointPairs[phase][1].style.display = 'none';

					phase--; // force user to go back
					error = true; // set error state
				}
				else {
					coords.push([-1, -1, -1, checkpointFinal.id, checkpointFinal.getBoundingClientRect().x, checkpointFinal.getBoundingClientRect().y, 'none', -1, -1]);
					document.getElementById("liftModal").style.display = 'block'; // show error modal
					checkpointFinal.style.display = 'none';
					//checkpointPairs[phase - 1][0].style.display = 'none';
					phase--; // force user to go back
					error = true; // set error state
				}
			}
		}
	});
});

function closeErrorModal() {
	document.getElementById("errorModal").style.display = 'none';
	document.getElementById("liftModal").style.display = 'none';
}

function closeResultsModal() {
	document.getElementById("resultsModal").style.display = 'none';
	window.location.replace("/");

}

function closeRestartModal() {
	document.getElementById("restartsModal").style.display = 'none';
	window.location.reload();
}
