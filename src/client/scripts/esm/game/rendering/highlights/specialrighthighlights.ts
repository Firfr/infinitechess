
/**
 * This is a DEBUGGING script for rendering special right and enpassant highlights.
 * 
 * Enable by pressing `7`.
 */

import type { Coords } from "../../../chess/util/coordutil.js";
import type { Vec3, Color } from "../../../util/math.js";


import { BufferModelInstanced, createModel, createModel_Instanced } from "../buffermodel.js";
import gameslot from "../../chess/gameslot.js";
import coordutil from "../../../chess/util/coordutil.js";
import frametracker from "../frametracker.js";
import legalmovehighlights from "./legalmovehighlights.js";
import boardpos from "../boardpos.js";
// @ts-ignore
import statustext from "../../gui/statustext.js";
// @ts-ignore
import legalmoveshapes from "../instancedshapes.js";



// Variables -------------------------------------------------------------------------------------


/** Customizations for the special rights highlights */
const SPECIAL_RIGHTS = {
	COLOR: [0, 1, 0.5, 0.3] as Color,
	/** Method that returns the single-instance vertex data for the shape */
	// SHAPE_FUNC: legalmoveshapes.getDataLegalMoveCornerTris,
	// SHAPE_FUNC: legalmoveshapes.getDataLegalMoveSquare,
	SHAPE_FUNC: legalmoveshapes.getDataPlusSign,
};

/** Customizations for the enpassant highlight */
const ENPASSANT = {
	COLOR: [0.5, 0, 1, 0.3] as Color,
	/** Method that returns the single-instance vertex data for the shape */
	// SHAPE_FUNC: legalmoveshapes.getDataLegalMoveCornerTris,
	// SHAPE_FUNC: legalmoveshapes.getDataLegalMoveDot,
	SHAPE_FUNC: legalmoveshapes.getDataLegalMoveSquare,
};

/** Whether to render special right and enpassant highlights */
let enabled = false;
let model: BufferModelInstanced | undefined;


// Functions -------------------------------------------------------------------------------------


function toggle() {
	enabled = !enabled;
	statustext.showStatus(`Toggled special rights highlights: ${enabled}`, false, 0.5);
	regenModel();
	frametracker.onVisualChange();
}

function render() {
	if (!enabled) return; // Not enabled

	renderSpecialRights();
	renderEnPassant();
}

function regenModel() {
	if (!enabled) return; // Not enabled

	// console.log("Regenerating specialrights model");
	const gamefile = gameslot.getGamefile()!;
	const model_Offset: Coords = legalmovehighlights.getOffset();
	// Instance data
	const squaresToHighlight: Array<number> = [];
	for (const key of gamefile.state.global.specialRights) {
		const coords = coordutil.getCoordsFromKey(key);
		const offsetCoord = coordutil.subtractCoordinates(coords, model_Offset);
		squaresToHighlight.push(...offsetCoord);
	}
	const vertexData: number[] = SPECIAL_RIGHTS.SHAPE_FUNC(SPECIAL_RIGHTS.COLOR);
	model = createModel_Instanced(vertexData, squaresToHighlight, "TRIANGLES", true);
}

function renderSpecialRights() {
	if (!model) throw Error("Specialrights model not initialized");

	const boardPos: Coords = boardpos.getBoardPos();
	const model_Offset: Coords = legalmovehighlights.getOffset();
	const position: [number,number,number] = [
		-boardPos[0] + model_Offset[0], // Add the model's offset
		-boardPos[1] + model_Offset[1],
		0
	];
	const boardScale: number = boardpos.getBoardScale();
	const scale: [number,number,number] = [boardScale, boardScale, 1];

	model.render(position, scale);
}

function renderEnPassant() {
	const gamefile = gameslot.getGamefile()!;
	if (!gamefile.state.global.enpassant) return; // No enpassant gamefile property


	const boardPos: Coords = boardpos.getBoardPos();
	const position: Vec3 = [
		-boardPos[0],
		-boardPos[1],
		0
	];
	const boardScale: number = boardpos.getBoardScale();
	const scale: Vec3 = [boardScale, boardScale, 1];

	const data = ENPASSANT.SHAPE_FUNC(ENPASSANT.COLOR);
	const model = createModel(data, 2, "TRIANGLES", true);
	const transformedPosition: Vec3 = [
		position[0] + gamefile.state.global.enpassant.square[0],
		position[1] + gamefile.state.global.enpassant.square[1],
		position[2]
	];
	model.render(transformedPosition, scale);
}

/**
 * Called when any forward-global-move is made in the game, us or our opponent.
 * 
 * This does not count rewinding/forwarding (which are local changes),
 * nor does it count simulated moves, or moves only made using movepiece.makeMove() and then reverted.
 */
function onMove() {
	// console.log("On move");
	regenModel();
}

/** Erase the model so it doesn't carry over to next loaded game */
function onGameClose() {
	model = undefined;
}


// Exports -----------------------------------------------------------------------


export default {
	toggle,
	render,
	regenModel,
	onMove,
	onGameClose,
};