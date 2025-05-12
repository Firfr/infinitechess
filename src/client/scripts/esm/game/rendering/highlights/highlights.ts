
/**
 * This script renders all highlights:
 * 
 * Last move
 * Check
 * Legal moves (of selected piece and hovered arrows)
 */

// @ts-ignore
import highlightline from "./highlightline.js";
import checkhighlight from "./checkhighlight.js";
import { highlightLastMove } from "./lastmovehighlight.js";
import legalmovehighlights from "./legalmovehighlights.js";
import specialrighthighlights from "./specialrighthighlights.js";
import boardpos from "../boardpos.js";

// @ts-ignore
import type gamefile from "../../../chess/logic/gamefile";


/**
 * Renders all highlights, including:
 * 
 * Last move highlight
 * Red Check highlight
 * Legal move highlights
 * Hovered arrows legal move highlights
 * Outline of highlights render box
 */
function render(gamefile: gamefile) {
	highlightline.render();

	if (boardpos.areZoomedOut()) return; // Quit if we're zoomed out.
	highlightLastMove(gamefile);
	checkhighlight.render(gamefile);
	legalmovehighlights.render();
	specialrighthighlights.render(); // Should be after legalmovehighlights.render(), since that updates model_Offset
}

export default {
	render,
};