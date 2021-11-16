// Nexus Clash Breath 4 hypermap version 2.7.0
// Intended to be mobile device friendly and have cross browser compatibility
// Edited and updated by plscks
// I am not sure who the original author of this is.
// PLANE IDS: Port Hope = 0, Centrum = 1, Purg = 2, Ely = 3, Stygia = 4
document.getElementById("content").onmousemove = function(event) {getMousePosition(event)};
document.onclick = getMouseClick;
document.onkeydown = getKeyPress;
window.onscroll = function () {
	if (!touchMode) {
		updateTooltip("out")
	}
};

const planes = {
	0: {
		name: "Port Hope",
		color: "#FFFF00",
		size: {
			height: 407,
			width: 407,
			max_x: 69,
			min_x: 55,
			max_y: 17,
			min_y: 3
		}
	}
};
const encodeMax = maxEncodedValue()

let hasTouch;
let whitepointer = "&#9655;<font color='#aaaaaa'>";
let blackpointer = "&#9654;<font color='#ffffff'>";
let showTools = false; let keyMode = false; let showBadges = false; let showGuilds = false; let showDistricts = false; let showDescriptions = true; let setMarkers = false; let touchMode = false; let suppressTT = false; let touchPortalClick = false; let switchPlane = false;

let waterCostModifier = 2.0;
let portalMPCostModifier = 0.01;
let flightEnabled = false;
let travelMethodToggle = 0;
let mpValueToggle = 0;

let touchmodeFixLocation = false;

let guildsInitialized = false;
let badgesInitialized = false;
let X = 0;
let Y = 0;
let Z = 0;
let portalToggle = 0;
let portalTargetX = 0;
let portalTargetY = 0;
let portalTargetZ = 0;
let portalTargetW = 0;
let pathStartX = 0;
let pathStartY = 0;
let pathStartZ = 0;
let pathDestinationX = 0;
let pathDestinationY = 0;
let pathDestinationZ = 0;
let pathDestinationType = "House"; //for finding the closest building. x means use above XYZ destination coords instead
const planeName = (z) => {
	return `<span style='color: ${planes[z].color}'>${planes[z].name}</span>`
}
const planeNameClean = (z) => {
	return planes[z].name
}

let portals = new Array(encodeMax);
for (let i = 0; i < portals.length; ++i) {
	portals[i] = new Array(6); // entry 0 is amount of outgoing portals, entries 1-5 can be locations
}
let portalTravelMethods = new Array(encodeMax);
for (let i = 0; i < portalTravelMethods.length; ++i) {
	portalTravelMethods[i] = new Array(5); // like portals array, except strings (for portal, ferry etc), and the first entry is missing
}
let portalMPCosts = new Array(encodeMax);
for (let i = 0; i < portalMPCosts.length; ++i) {
	portalMPCosts[i] = new Array(5); // costs in MP
}
let TileNames = new Array(encodeMax);
for (let i = 0; i < TileNames.length; ++i) {
	TileNames[i] = "x";
}
let TileTypes = new Array(encodeMax);
for (let i = 0; i < TileTypes.length; ++i) {
	TileTypes[i] = "x";
}
let TileDescriptions = new Array(encodeMax);
for (let i = 0; i < TileDescriptions.length; ++i) {
	TileDescriptions[i] = new Array(2);
}
let badges = new Array(encodeMax);
for (let i = 0; i < badges.length; ++i) {
	badges[i] = new Array(3);
	badges[i][0] = "x";
}
let guilds = new Array(encodeMax);
for (let i = 0; i < guilds.length; ++i) {
	guilds[i] = new Array(2);
	guilds[i][0] = "x";
}
let markers = new Array(encodeMax);
for (let i = 0; i < markers.length; ++i) {
	markers[i] = false;
}

// borrowed from https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
// second comment
function is_touch_device4() {
	let prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
	let mq = function (query) {
		return window.matchMedia(query).matches;
	}

	if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
		return true;
	}

	// include the 'heartz' as a way to have a non matching MQ to help terminate the join
	// https://git.io/vznFH
	let query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
	return mq(query);
}

hasTouch = is_touch_device4();

if (hasTouch) toggleTouchscreenMode();

initializePortals();
initializeTiles();
let params = {}; let startParam; let destParam;
let origSidebar = document.getElementById("infoText").innerHTML

if (localStorage.getItem("expBadges")) {
	let expBadgeArray = [];
	let finishedBadgeList;
	let lookupBadges = localStorage.getItem("expBadges");
	lookupBadges = lookupBadges.toLowerCase();
	if (!showBadges) toggleBadges();
	checkBadges(lookupBadges);
	showhideMarkersPlanechange();
	localStorage.clear();
}

addAlert("For keyboard mode press K. With NVDA you will have to hold the Alt button and press all described key binds.");
if (hasTouch) {
	removeOldAlert();
}

function loadToolsPane() {
	showTools = !showTools;
	if (showTools) {
		document.getElementById("toolsButton").innerHTML = "Tools: ON";
		document.getElementById("infoText").innerHTML = "<br>Here are a couple of handy things I thought would be nice to have links for. First is a tool I wrote for looking up profiles by name, it utilizes the existing profile lookup API, the second is a slightly updated character planner, some typos are fixed and the buttons have been moved so as to not change position with the table. I did not write the planner, only modified the existing one.<br><br>Please report bugs or inaccuracies: <a href=https://github.com/plscks/testHYPERMAP/issues>HERE</a><br><br><a href=profileLookup.html>Nexus Clash Profile Lookup Tool</a><br><a href=chargen_b4_v2_5.html>Updated Character Planner</a><br><br><div id='portalInstructions'>Click to enter portals, Shift-click to cycle through destinations.</div>";
	} else {
		document.getElementById("toolsButton").innerHTML = "Tools: OFF";
		document.getElementById("infoText").innerHTML = origSidebar;
	}
}

function toggleFlightCheckbox() {
	flightEnabled = !flightEnabled;
	if (flightEnabled) document.getElementById("flightToggleButton").innerHTML = " Simulate Flight/Blink/Leap: ON"
	else document.getElementById("flightToggleButton").innerHTML = " Simulate Flight/Blink/Leap: OFF";
}


/**
 * Returns the encoded value of a given x, y, z coordinate.
 * @param x {Number} x coordinate
 * @param y {Number} y coordinate
 * @param z {Number} z coordinate
 * @returns {Number} Encoded value of the given x, y, z coordinate
 */
function encodeLocation(x,y,z) {
	let val = x + y*72 + z*3600;
	if (x < planes[z].size.min_x || y < planes[z].size.min_y || x > planes[z].size.max_x || y > planes[z].size.max_y) {
		val = encodeMax - 1;
	}
	return val;
}

/**
 * Decodes a numerical value back into x, y, z coordinates.
 * @param val {Number} Integer value to be decoded
 * @returns {any[]} Returns result array where result[0]=coord_x, result[1]=coord_y, and result[2]=coord_z
 */
function decodeLocation(val) {
	const result = new Array(3);
	result[2] = Math.floor(val/3600);
	result[1] = Math.floor((val-result[2]*3600)/72);
	result[0] = Math.floor((val-result[1]*72)%72);
	return result;
}


function setStart(x,y,z) {
	if (setMarkers) toggleMarkerMode();
	pathStartX = x;
	pathStartY = y;
	pathStartZ = z;
  let index = encodeLocation(x,y,z);
	for(let i = 0; i < encodeMax; i++) {
		if (markers[i]) {
			document.getElementById("markerButtonDelete" + i).style.display = "none";
			if (i != index) {
				document.getElementById("markerButtonDestination" + i).style.display = "inline-block";
				document.getElementById("markerButtonStart" + i).style.display = "none";
			} else {
				document.getElementById("markerButtonStart" + i).style.display = "none";
			}
		}
	}
	document.getElementById("sidebarDestinationTypelist").style.display = "inline-block";
}

function setDestination(x,y,z) {
	pathDestinationX = x;
	pathDestinationY = y;
	pathDestinationZ = z;
	pathDestinationType = "not_set";
  	let index = encodeLocation(x,y,z);
	clearAllMarkers();
	calculatePath();
}

function setDestinationType(type) {
	if (type == "not_set") return;
	type = type.toLowerCase();
	pathDestinationX = 0;
	pathDestinationY = 0;
	pathDestinationZ = 0;
	pathDestinationType = type;
	clearAllMarkers();
	calculatePath();
}

function toggleMarker(x,y,z) {
	console.log(`toggleMarker x: ${x} y: ${y} z: ${z} | X: ${X} Y: ${Y}`);
	const posX = (x-(planes[Z].size.min_x-1))*24 - 1;
	const posY = (y-(planes[Z].size.min_y-1))*24;
	console.log(`posX: ${posX} posY: ${posY}`);
	let index = encodeLocation(x,y,z);
	markers[index] = !markers[index];
	if (markers[index]) {
		console.log(`adding marker posX: ${posX} posY: ${posY}`);
		document.getElementById("sidebarMarkerlist").innerHTML += "<div class='markerinfo' id=" + "markerinfo" + index + "><div class='markerLocationText'>" + getLocationString(x,y,z) + "</div><div class='markerUIbuttonRed' id='" + "markerButtonDelete" + index + "' onclick='toggleMarker(" + x + "," + y + "," + z + ")'>delete</div><div class='markerUIbuttonBlue' id='" + "markerButtonStart" + index + "' onclick='setStart(" + x + "," + y + "," + z + ")'>start</div><div class='markerUIbuttonGreen' id='" + "markerButtonDestination" + index + "' onclick='setDestination(" + x + "," + y + "," + z + ")'>>&nbsp;plot path here</div></div>";
		document.getElementById("content").innerHTML += "<div class='marker' id=" + "markerpoint" + index + " style='top: " + posY + "px; left: " + posX + "px;'></div>";
	} else {
		console.log('removing marker');
		let markerPoint = document.getElementById("markerpoint" + index);
		markerPoint.parentNode.removeChild(markerPoint);
		let markerInfo = document.getElementById("markerinfo" + index);
		markerInfo.parentNode.removeChild(markerInfo);
	}
}

function clearAllMarkers() {
	document.getElementById("sidebarDestinationTypelist").style.display = "none";
	for(let i = 0; i < encodeMax; i++) {
		if (markers[i]) {
			document.getElementById("markerButtonDelete" + i).style.display = "inline-block";
			document.getElementById("markerButtonDestination" + i).style.display = "none";
			document.getElementById("markerButtonStart" + i).style.display = "inline-block";
			document.getElementById("markerButtonStart" + i).style.display = "inline-block";
		}
	}
}

function clearMarkers() {
	for(let i = 0; i < encodeMax; i++) {
		if (markers[i]) {
			let arr = decodeLocation(i);
			toggleMarker(arr[0],arr[1],arr[2]);
		}
	}
}

function resetMarkers() {
	document.getElementById("sidebarDestinationTypelist").style.display = "none";
	for(let i = 0; i < encodeMax; i++) {
		if (markers[i]) {
			let arr = decodeLocation(i);
			toggleMarker(arr[0],arr[1],arr[2]);
		}
	}
	for (let i = 0; i < markers.length; ++i) {
		markers[i] = false;
	}
	if (showBadges) toggleBadges();
}

function cycleTravelMethod() {
	travelMethodToggle += 1;
	if (travelMethodToggle > 4) travelMethodToggle = 0;
	if (travelMethodToggle == 0) {
		waterCostModifier = 2.0;
		flightEnabled = false;
		document.getElementById("buttonTravelMethod").innerHTML = "Mortal Movement";
	} else if (travelMethodToggle == 1) {
		waterCostModifier = 1.0;
		flightEnabled = true;
		document.getElementById("buttonTravelMethod").innerHTML = "Flight Costs: 0.5AP";
	} else if (travelMethodToggle == 2) {
		waterCostModifier = 1.0;
		flightEnabled = false;
		document.getElementById("buttonTravelMethod").innerHTML = "Non-flight Costs: 0.5AP";
	} else if (travelMethodToggle == 3) {
		waterCostModifier = 1.0;
		flightEnabled = false;
		document.getElementById("buttonTravelMethod").innerHTML = "Movement with Swim";
	} else if (travelMethodToggle == 4) {
		waterCostModifier = 0.0;
		flightEnabled = false;
		document.getElementById("buttonTravelMethod").innerHTML = "Free water movement";
	}
}

function cycleMPValue() {
	mpValueToggle += 1;
	if (mpValueToggle > 4) mpValueToggle = 0;
	if (mpValueToggle == 0) {
		portalMPCostModifier = 0.001;
		document.getElementById("buttonMPValue").innerHTML = "MP Cost: IGNORE MP COSTS";
	} else if (mpValueToggle == 1) {
		portalMPCostModifier = 0.2;
		document.getElementById("buttonMPValue").innerHTML = "MP Cost: TOLERATE (1 MP ~ 0.2 AP)";
	} else if (mpValueToggle == 2) {
		portalMPCostModifier = 0.5;
		document.getElementById("buttonMPValue").innerHTML = "MP Cost: TOLERATE (1 MP ~ 0.5 AP)";
	} else if (mpValueToggle == 3) {
		portalMPCostModifier = 1;
		document.getElementById("buttonMPValue").innerHTML = "MP Cost: TOLERATE (1 MP ~ 1 AP)";
	} else if (mpValueToggle == 4) {
		portalMPCostModifier = 20;
		document.getElementById("buttonMPValue").innerHTML = "MP Cost: AVOID INTERPLANAR";
	}
}

function customDestination() {
	 let destText = document.forms["customDestinationForm"]["dest"].value;
	 destText = destText.toLowerCase();
	 setDestinationType(destText);
}

function pathCostModifier(index) {
	let modifier = 1.0;
	if (TileTypes[index] == "sea" || TileTypes[index] == "sea") {
		modifier = waterCostModifier;
	} else if (TileTypes[index] == "lake") {
		modifier = waterCostModifier;
	} else if (TileTypes[index] == "peaceful sea") {
		modifier = waterCostModifier;
	} else if (TileTypes[index] == "river" || TileTypes[index] == "river") {
		modifier = waterCostModifier;
	} else if (TileTypes[index] == "searing river") {
		modifier = waterCostModifier;
	} else if (TileTypes[index] == "lava") {
		modifier = waterCostModifier;
	} else if (TileTypes[index] == "mountain") {
		if (flightEnabled) {
			modifier = 1.0;
		} else {
			modifier = 2.0;
		}
	} else if (TileTypes[index] == "Void") {
		if (flightEnabled) {
			modifier = 0.5;
		} else {
			modifier = 100.0;
		}
	} else if (TileTypes[index] == "empty sky" || TileTypes[index] == "void") {
		if (flightEnabled) {
			modifier = 0.5;
		} else {
			modifier = 100.0;
		}
	}
	return modifier;
}

function getSuccessorArray(index) {
	let arr = decodeLocation(index);
	let baseNeighbourNumber = 8;

	if (!validLocation(arr[0],arr[1],arr[2])) return [];

	portalsArray = portals[encodeLocation(arr[0],arr[1],arr[2])];
	portalsMPCostArray = portalMPCosts[encodeLocation(arr[0],arr[1],arr[2])];
	let numberOfPortals = 0;

	if (portalsArray[0] > 0) {
		numberOfPortals = portalsArray[0];
	}

	let result = new Array(baseNeighbourNumber + numberOfPortals);
	for(let i = 0; i < baseNeighbourNumber + numberOfPortals; i++) result[i] = new Array(2);
	let encoded;

	encoded = encodeLocation(arr[0]+1,arr[1],arr[2]);

	if (pathCostModifier(encoded) == 100.0){
		result[0][0] = "" + encoded;
		result[0][1] = Infinity;
	} else {
		result[0][0] = "" + encoded;
		result[0][1] = 999*pathCostModifier(encoded);
	}

	encoded = encodeLocation(arr[0]-1,arr[1],arr[2]);
	if (pathCostModifier(encoded) == 100.0){
		result[1][0] = "" + encoded;
		result[1][1] = Infinity;
	} else {
		result[1][0] = "" + encoded;
		result[1][1] = 999*pathCostModifier(encoded);
	}

	encoded = encodeLocation(arr[0],arr[1]+1,arr[2]);
	if (pathCostModifier(encoded) == 100.0){
		result[2][0] = "" + encoded;
		result[2][1] = Infinity;
	} else {
		result[2][0] = "" + encoded;
		result[2][1] = 999*pathCostModifier(encoded);
	}

	encoded = encodeLocation(arr[0],arr[1]-1,arr[2]);
	if (pathCostModifier(encoded) == 100.0){
		result[3][0] = "" + encoded;
		result[3][1] = Infinity;
	} else {
		result[3][0] = "" + encoded;
		result[3][1] = 999*pathCostModifier(encoded);
	}

	encoded = encodeLocation(arr[0]+1,arr[1]+1,arr[2]);
	if (pathCostModifier(encoded) == 100.0){
		result[4][0] = "" + encoded;
		result[4][1] = Infinity;
	} else {
		result[4][0] = "" + encoded;
		result[4][1] = 1000*pathCostModifier(encoded);
	}

	encoded = encodeLocation(arr[0]+1,arr[1]-1,arr[2]);
	if (pathCostModifier(encoded) == 100.0){
		result[5][0] = "" + encoded;
		result[5][1] = Infinity;
	} else {
		result[5][0] = "" + encoded;
		result[5][1] = 1000*pathCostModifier(encoded);
	}

	encoded = encodeLocation(arr[0]-1,arr[1]+1,arr[2]);
	if (pathCostModifier(encoded) == 100.0){
		result[6][0] = "" + encoded;
		result[6][1] = Infinity;
	} else {
		result[6][0] = "" + encoded;
		result[6][1] = 1000*pathCostModifier(encoded);
	}

	encoded = encodeLocation(arr[0]-1,arr[1]-1,arr[2]);
	if (pathCostModifier(encoded) == 100.0){
		result[7][0] = "" + encoded;
		result[7][1] = Infinity;
	} else {
		result[7][0] = "" + encoded;
		result[7][1] = 1000*pathCostModifier(encoded);
	}

	for(let i = baseNeighbourNumber; i < baseNeighbourNumber+numberOfPortals; i++) {
		result[i][0] = "" + portalsArray[i+1-baseNeighbourNumber];
		result[i][1] = 1001 + portalsMPCostArray[i-baseNeighbourNumber]*1000*portalMPCostModifier;
	}

	resultCleaned = new Array(0);
	for(let i = 0; i < baseNeighbourNumber+numberOfPortals; i++) {
		if (result[i][0] < encodeMax-1) {
			resultCleaned.push(result[i]);
		}
	}
	return resultCleaned;
}

function calculatePath() {

	let d = new Dijkstras();

	let map = new Array(encodeMax);
	for(let i = 0; i < encodeMax; i++) {
		map[i] = new Array(2);
		map[i][0] = "" + i;
		map[i][1] = getSuccessorArray(i);
	}

	d.setGraph(map);

	let tempPath = d.getPath("" + encodeLocation(pathStartX,pathStartY,pathStartZ), "" + encodeLocation(pathDestinationX,pathDestinationY,pathDestinationZ));
	let path = [encodeLocation(pathStartX,pathStartY,pathStartZ)];
	for(let i = 0; i < tempPath.length; i++) {
		path.push(tempPath[i]);
	}

	let pathString = "HYPERMAP Pathfinder: Start from " + getPastableLocationString(pathStartX,pathStartY,pathStartZ) + ". \n";

	clearMarkers();

	let walkCount = -1; let walkCountTotal = 0;

	let currentX = pathStartX;
	let currentY = pathStartY;
	let currentPlane = pathStartZ;
	pathDestinationX = decodeLocation(path[path.length-1])[0];
	pathDestinationY = decodeLocation(path[path.length-1])[1];
	pathDestinationZ = decodeLocation(path[path.length-1])[2];
	for(let i = 0; i < path.length; i++) {
		let arr = decodeLocation(path[i]);
		console.log(`togglemarker x: ${arr[0]} y: ${arr[1]} z: ${arr[2]}`);
		toggleMarker(arr[0],arr[1],arr[2]);
		let prevArr = decodeLocation(path[i-1]);
		if (arr[2] != currentPlane) {
			if (walkCount > 0) pathString += getWalkString(currentX,currentY,prevArr[0],prevArr[1]) + getPastableLocationString(prevArr[0],prevArr[1],prevArr[2]) + ". \n";
			walkCount = 0;
			currentX = arr[0];
			currentY = arr[1];
			pathString += "Take Portal to " + getPastableLocationString(arr[0],arr[1],arr[2]) + ". \n";
			currentPlane = arr[2];
		} else if ((arr[1] < prevArr[1]-1) || (arr[1] > prevArr[1]+1) || (arr[0] < prevArr[0]-1) || (arr[0] > prevArr[0]+1)) {
			if (walkCount > 0) pathString += getWalkString(currentX,currentY,prevArr[0],prevArr[1]) + getPastableLocationString(prevArr[0],prevArr[1],prevArr[2]) + ". \n";
			walkCount = 0;
			currentX = arr[0];
			currentY = arr[1];
			let prevArr = decodeLocation(path[i-1]);
			let portalType = portalTravelMethods[path[i-1]][0];
			pathString += `Take ${portalType} to ` + getPastableLocationString(arr[0],arr[1],arr[2]) + ". \n";
		} else {
			walkCount++;
		}
	/*

	pathString += "(" + arr[0] + "," + arr[1] + ") " + planeName; */
	}

	if (walkCount > 0) pathString += getWalkString(currentX,currentY,pathDestinationX, pathDestinationY);
	pathString += "destination at " + getPastableLocationString(pathDestinationX, pathDestinationY, pathDestinationZ) + ". ";

	showhideMarkersPlanechange();

	if(tempPath.length > 0)
		window.prompt("Copy path to clipboard with Ctrl+C, then press Enter", pathString);
	else
		alert("Destination could not be found! This could indicate that you need a flight skill to get from your chosen start to your chosen destination, consider changing the movement option to one with flight");
}

function getWalkString(x,y,dx,dy) {
	let N = 0; S = 0; W = 0; E = 0; NW = 0; NE = 0; SW = 0; SE = 0;
	if (x > dx) W = x-dx; // walk W
	else if (x < dx) E = dx-x// walk E
	if (y > dy) N = y-dy; // walk N
	else if (y < dy) S = dy-y// walk S

	if (N > 0) {
		if (W > 0) {
			NW = Math.min(N,W);
			N -= NW;
			W -= NW;
		} else if (E > 0) {
			NE = Math.min(N,E);
			N -= NE;
			E -= NE;
		}
	} else if (S > 0) {
		if (W > 0) {
			SW = Math.min(S,W);
			S -= SW;
			W -= SW;
		} else if (E > 0) {
			SE = Math.min(S,E);
			S -= SE;
			E -= SE;
		}
	}

	let Nstring = (N > 0) ? ""+N+"N " : "";
	let Sstring = (S > 0) ? ""+S+"S " : "";
	let Wstring = (W > 0) ? ""+W+"W " : "";
	let Estring = (E > 0) ? ""+E+"E " : "";
	let NWstring = (NW > 0) ? ""+NW+"NW " : "";
	let NEstring = (NE > 0) ? ""+NE+"NE " : "";
	let SWstring = (SW > 0) ? ""+SW+"SW " : "";
	let SEstring = (SE > 0) ? ""+SE+"SE " : "";

	return "Walk " + NWstring + NEstring + SWstring + SEstring + Nstring + Sstring + Wstring + Estring + "to ";
}

function getPastableLocationString(x,y,z) {
	return "(" + x + "," + y + ", " + planeNameClean(z) + ") " + TileNames[encodeLocation(x,y,z)];
}

function showhideMarkersPlanechange() {
	console.log(`Running showhideMarkerPlanechange()`);
	for (let i = 0; i < encodeMax; i++) {
		if (markers[i]) {
			let arr = decodeLocation(i);
			const posX = (arr[0]-(planes[Z].size.min_x-1))*24 - 1;
			const posY = (arr[1]-(planes[Z].size.min_y-1))*24;
			if (arr[2] != Z) {
				document.getElementById("markerpoint" + i).style.top = "-100px";
			} else {
				document.getElementById("markerpoint" + i).style.top = `${posY}px`;
				document.getElementById("markerpoint" + i).style.left = `${posX}px`;
			}
		}
	}
}

function showPlane(planeIndex) {
	Z = planeIndex;
	document.getElementById("overlay").style.width = `${planes[Z].size.width}px`;
	document.getElementById("overlay").style.height = `${planes[Z].size.height}px`;
	document.getElementById("overlay").style.display = "none";
	if (keyMode) {
		if (planeIndex == 0) keyModeMoveSelector(11, 3, 276, 84);
	}
	showhideMarkersPlanechange();
	if (showBadges) {
		switchPlane = true;
		toggleBadges(switchPlane);
	}
	if (showGuilds) toggleGuilds();
	if (showDistricts) toggleDistricts();
	document.getElementById("valhalla").style.display = "none";
	document.getElementById("you").style.left = "-600px";
	document.getElementById("you").style.top = "-600px";
	if (Z == 0) document.getElementById("valhalla").style.display = "block";
}

function toggleTouchscreenMode() {
	touchmodeFixLocation = false;
	touchMode = !touchMode;
	if (touchMode) {
		document.getElementById("mobileModeButton").innerHTML = "Touchscreen Mode: ON";
		document.getElementById("portalInstructions").innerHTML = "<font color='#ffff00'>Touchscreen Mode: Tap to bring up tooltip. Use buttons on tooltip <br>to enter portals or cycle through the destination options.</font>";
	} else {
		document.getElementById("mobileModeButton").innerHTML = "Touchscreen Mode:  OFF";
		document.getElementById("portalInstructions").innerHTML = "Click to enter portals, Shift-click to cycle through destinations.";
	}
}

function toggleMarkerMode() {
	setMarkers = !setMarkers;
	if (setMarkers) document.getElementById("markerModeButton").innerHTML = "Markers: ON";
	else document.getElementById("markerModeButton").innerHTML = "Markers: OFF";
}

function toggleDescriptions() {
	showDescriptions = !showDescriptions;
	if (showDescriptions) document.getElementById("descriptionsButton").innerHTML = "Descriptions: ON";
	else document.getElementById("descriptionsButton").innerHTML = "Descriptions: OFF";
}

function getKeyPress(e) {
	if (document.activeElement.id == "customText") return;
	if (e.key == 'Alt') {
		e.preventDefault();
	}
	if (e.key == 'b') {
		// toggleBadges();
	}
	if (e.key == 'm') {
		if (xyzValid()) toggleMarker(X,Y,Z);
	}
	if (e.key == '1') showPlane(0);
	if (e.key == 'k') toggleKeyboardMode();
	if (keyMode) {
		if (e.key =='g') {
			gotoCoord();
		}
		if (e.key == 'ArrowDown') {
			e.preventDefault();
			if (Z == 0 && Y == 17) return;
			Y += 1;
			KeyY += 24;
			keyModeMoveSelector(X, Y, KeyX, KeyY);
		}
		if (e.key == 'ArrowUp') {
			e.preventDefault();
			if (Y == 1 || KeyY <= 24) return;
			Y -= 1;
			KeyY -= 24;
			keyModeMoveSelector(X, Y, KeyX, KeyY);
		}
		if (e.key == 'ArrowRight') {
			e.preventDefault();
			if (Z == 0 && X == 69) return;
			X += 1;
			KeyX += 24;
			keyModeMoveSelector(X, Y, KeyX, KeyY);
		}
		if (e.key == 'ArrowLeft') {
			e.preventDefault();
			if (X == 55 || KeyX <= 24) return;
			X -= 1;
			KeyX -= 24;
			keyModeMoveSelector(X, Y, KeyX, KeyY);
		}
		if (e.key == 'Enter') {
			e.preventDefault();
			if (xyzValid()) toggleMarker(X,Y,Z);
		}
	}
}

function toggleKeyboardMode() {
	keyMode = !keyMode;
	if (keyMode) {
		document.getElementById("portalInstructions").setAttribute("aria-live", "assertive");
		document.getElementById("portalInstructions").innerHTML = "<font color='#ffff00'>Keyboard Mode: Use the arrow keys to move the selector.<br>Press the G key to move the selector to a specific tile.<br>Change planes by hitting the number keys.<br>1 is Laurentia, 2 is the Sewers, 3 is Elysium, 4 is Stygia, 5 is the Wyrm's Lair, and 6 is Terra Nullius.</font>";
		document.getElementById("content").setAttribute("aria-live", "polite");
		if (Z == 0) keyModeMoveSelector(11, 3, 276, 84);
	} else {
		document.getElementById("portalInstructions").innerHTML = "Click to enter portals, Shift-click to cycle through destinations.";
	}
}

function keyModeMoveSelector(x, y, keyX, keyY) {
	if (touchmodeFixLocation) return;
	let canvas = document.getElementById('content');
  let rect = canvas.getBoundingClientRect();
	document.getElementById("signal").style.left = `-50px`;
	document.getElementById("signal").style.top = `-50px`;
	let tooltipContent = "";
	X = x;
	Y = y;
	KeyX = keyX;
	KeyY = keyY;
	document.getElementById("tooltip").style.left = `${KeyX + 24}px`;
	document.getElementById("tooltip").style.top = `${KeyY - 24}px`;
	if (Y > 0) {
		document.getElementById("pointer").style.left = `${X*24 - 24}px`;
		document.getElementById("pointer").style.top = `${Y*24 - 24}px`;
	}
	if (Y < 3 || X < 55) { updateTooltipKeyMode("out"); }
	else if ((Z == 0 && X > 69) || ( Z == 0 && Y > 17)) {	updateTooltipKeyMode("out"); }
	else { updateTooltipKeyMode("in"); }
}

function updateTooltipKeyMode(state) {
	let tooltipContent = "<div id='tooltiptext' aria-live='assertive'>";
	if (state == 'id') {
		tooltipContent += getLocationString(X,Y,Z,'id') + getTouchmodeTooltipControls() + getBadgeString(X,Y,Z) + portalsString() + "</div>";
	} else if (!xyzValid()) {
		tooltipContent += getLocationString(X,Y,Z,'notvalid') + getTouchmodeTooltipControls() + getBadgeString(X,Y,Z) + portalsString() + "</div>";
	} else {
		tooltipContent += getLocationString(X,Y,Z,'in') + getTouchmodeTooltipControls() + getBadgeString(X,Y,Z) + portalsString() + "</div>";
	}
	if (state == "out") {
		document.getElementById("tooltip").style.display = "none";
		document.getElementById("pointer").style.display = "none";
		return;
	}
	document.getElementById("tooltip").style.display = "";
	document.getElementById("pointer").style.display = "";
	if (portalTargetZ > -1) {
		tooltipContent += "<div id='previewmap'><img src='preview_overlay.png' style='z-index:5'/></div>";
	}
	document.getElementById("tooltip").innerHTML = tooltipContent;
	if (portalTargetZ > -1) {
		if (portalTargetZ == 0) document.getElementById("previewmap").style.background = "url(mini-valhalla.png)";
		document.getElementById("previewmap").style.backgroundPosition = "" + -((portalTargetX-5)*12+50) + "px " + -((portalTargetY-5)*12+50) + "px";
	}
}

function gotoCoord() {
	if (Z == 0) {
		let plane = planes[0];
	}
	let inputString = prompt("Please input the coordinates you would like to go to in X comma space Y format \n \n NOTE: Valid coordinates for " + plane[0] + " are X direction one through " + plane[1] + " and Y direction one through " + plane[2] + "! Use only one comma and one space.", "Please input the coordinates you would like to go to in X comma space Y format \n \n NOTE: Valid coordinates for " + plane[0] + " are X direction one through " + plane[1] + " and Y direction one through " + plane[2] + "! Use only one comma and one space.");
	if (inputString == null) return;
	let splitInput = inputString.split(", ");
	if (splitInput[1] === undefined) {
		addAlert('Invalid coordinates, please try again.');
		return;
	}
	let inX = parseInt(splitInput[0], 10);
	let inY = parseInt(splitInput[1], 10);
	if (inX > plane[1] || inY > plane[2]) {
		addAlert('Invalid coordinates, please try again.');
		return;
	} else if (inX === undefined || inY === undefined) {
		addAlert('Invalid coordinates, please try again.');
		return;
	}
	let keyX = inX*24 + 12;
	let keyY = inY*24 + 12;
	keyModeMoveSelector(inX, inY, keyX, keyY);
}

function removeOldAlert() {
   let oldAlert = document.getElementById("alert");
   if (oldAlert) {
     document.body.removeChild(oldAlert);
   }
 }

 function addAlert(aMsg) {
   removeOldAlert();
   let newAlert = document.createElement("div");
   newAlert.setAttribute("role", "alert");
   newAlert.setAttribute("id", "alert");
   let msg = document.createTextNode(aMsg);
   newAlert.appendChild(msg);
   document.body.appendChild(newAlert);
 }

 function checkValidity(aID, aSearchTerm, aMsg) {
   let elem = document.getElementById(aID);
   let invalid = (elem.value.indexOf(aSearchTerm) < 0);
   if (invalid) {
     elem.setAttribute("aria-invalid", "true");
     addAlert(aMsg);
   } else {
     elem.setAttribute("aria-invalid", "false");
     removeOldAlert();
   }
 }

/**
 * Returns true or false, based on X, Y, Z globals obtained from getMousePosition()
 * @returns {boolean}
 */
function xyzValid() {
	return validLocation(X,Y,Z);
}


/**
 * Returns true if allowed tile type and false if in the invalid list. Note the the invalid list must be lowercase
 * @param x {Number} X coordinate to check
 * @param y {Number} Y coordinate to check
 * @param z {Number} Z coordinate to check
 * @returns {boolean}
 */
function validLocation(x,y,z) {
	if (z >= Object.keys(planes).length) {
		return false;
	}
	let valid = true;
	const invalid_tiles = ["solid earth", "", "x", "twisted space", "void"];
	valid = !invalid_tiles.includes(TileTypes[encodeLocation(x,y,z)]);
	if (x < planes[z].size.min_x || y < planes[z].size.min_y || x > planes[z].size.max_x || y > planes[z].size.max_y) {
		valid = false;
	}
	return valid;
}

function enterPortal() {
	touchmodeFixLocation = false;
	touchPortalClick = false;
	if (portalTargetZ > -1) {
		if (portalTargetZ != Z) {
			showPlane(portalTargetZ);
			portalTargetZ = -1;
		}
		document.getElementById("you").style.left = `${portalTargetX*24 - 24}px`;
		document.getElementById("you").style.top = `${portalTargetY*24 - 24}px`;
	}
	document.getElementById("tooltip").style.top = `-300px`;
}

function isPortal() {
	if (X < 0 || Y < 0 || Z < 0){
		return;
	} else {
		return portals[encodeLocation(X, Y, Z)][0] > 0;
	}
}

function cyclePortals() {
	portalToggle++;
	updateTooltip("in");
}

function cancelPortalTouch() {
	touchmodeFixLocation = false;
	touchPortalClick = false;
}

function getMouseClick(e) {
	if (touchPortalClick) {
		touchmodeFixLocation = true;
		updateTooltip("in");
	}
	getMousePosition(e);
	if (setMarkers) {
		if (xyzValid()) {
			toggleMarker(X,Y,Z);
		}
	} else if (!touchMode) {
		if (isPortal()) {
			if (e.shiftKey) {
				e.preventDefault();
				cyclePortals();
			} else {
				enterPortal();
			}
		}
	} else if (touchMode) {
		if (isPortal()) {
			if (!touchmodeFixLocation) {
				touchmodeFixLocation = true;
				updateTooltip("in");
			}
		}
	} else {
		return;
	}
}

/**
 * Sets global X, Y, Z coordinate position based on mouse movement event. All graphical assets that rely on mouse input
 * should be set here.
 * @param e
 */
function getMousePosition(e) {
	if (keyMode) return;
	if (touchmodeFixLocation) return;
	let canvas = document.getElementById('content');
  	let rect = canvas.getBoundingClientRect();
  	let mouseX = e.clientX - rect.left;
  	let mouseY = e.clientY - rect.top;
	document.getElementById("signal").style.left = `${-50}px`;
	document.getElementById("signal").style.top = `${-50}px`;
	let tooltipContent = "";
	X = Math.floor((mouseX - 0) / 24) + (planes[Z].size.min_x - 1);
	Y = Math.floor((mouseY + 0) / 24) + (planes[Z].size.min_y - 1);
	if (setMarkers && hasTouch) {
		if (xyzValid()) toggleMarker(X,Y,Z);
	}
	if (hasTouch && isPortal()) {
		touchPortalClick = !touchPortalClick;
		getMouseClick(e);
	}
	// console.log(`position: (${X}, ${Y}) mouse (${mouseX}, ${mouseY})`);
	document.getElementById("overlay").style.display = "none";
	document.getElementById("overlay").style.margin = '0';
	document.getElementById("tooltip").style.left = `${mouseX + 24}px`;
	document.getElementById("tooltip").style.top = `${mouseY - 24}px`;
	if (Z == 0 && Y > 2) {
		document.getElementById("pointer").style.left = `${Math.floor(mouseX/24)*24-26}px`;
		document.getElementById("pointer").style.top = `${Math.floor(mouseY/24)*24-24}px`;
	}
	if (!xyzValid() || (e.clientY < 35)) {
		document.getElementById("tooltip").style.top = `-500px`;
		document.getElementById("pointer").style.top = `-500px`;
	} else {
		updateTooltip("in")
	}
	document.getElementById("pointer").children[0].src = 'icons/pointer.png'
}


function getTouchmodeTooltipControls() {
	let buttonString = "";
	if (portals[encodeLocation(X,Y,Z)][0] > 1) buttonString = "<div id='tooltipControlsButtonCycle' onClick='cyclePortals()'>Cycle portal</div>";
	if (portals[encodeLocation(X,Y,Z)][0] > 0) buttonString += "<div id='tooltipControlsButtonEnter' onClick='enterPortal()'>Enter</div><div id='tooltipControlsButtonCancel' onClick='cancelPortalTouch()'>Cancel</div>";
	if (touchMode) return "<br><div id='tooltipControls'>" + buttonString + "</div>";
	else return "";
}

function updateTooltip(state) {
	let tooltipContent = "<div id='tooltiptext'>";
	tooltipContent += getLocationString(X,Y,Z,'normal') + getTouchmodeTooltipControls() + getBadgeString(X,Y,Z) + portalsString() + "</div>";

	if (state == "out") {
		document.getElementById("tooltip").style.display = "none";
		document.getElementById("pointer").style.display = "none";
		document.getElementById("overlay").style.display = "none";
		document.getElementById("overlay").style.margin = '0';
		return;
	}
	document.getElementById("tooltip").style.display = "";
	document.getElementById("pointer").style.display = "";
	if (portalTargetZ > -1) {
		tooltipContent += "<div id='previewmap'><img src='preview_overlay.png' style='z-index:5'></div>";
	}
	document.getElementById("tooltip").innerHTML = tooltipContent;
	// mini pictures are inclusive to outermost line grid and have 50px border of solid black sizes are aproximately original divided by two rounded up
	if (portalTargetZ > -1) {
		document.getElementById("overlay").style.display = "block";
		document.getElementById("overlay").style.height = `${planes[Z].size.height-46}px`;
		document.getElementById("overlay").style.width = `${planes[Z].size.width-46}px`;
		document.getElementById("overlay").style.margin = `23px`;
		if (portalTargetZ == 0) document.getElementById("previewmap").style.background = "url(mini-valhalla.png)";
		document.getElementById("previewmap").style.backgroundPosition = "" + -((portalTargetX-5)*12+50) + "px " + -((portalTargetY-5)*12+50) + "px";
	} else {
		document.getElementById("overlay").style.display = "none";
		document.getElementById("overlay").style.margin = '0';
	}
}

function getBadgeString(x,y,z) {
	let index = encodeLocation(x,y,z);
	let result = "";
	if ((badges[index][0] != "x") && (showBadges == true)) {
		result += "<br><br><font color='#FF00FF'><b>" + badges[index][1] + "</b></font><font color='999999'> (" + badges[index][0] + ")</font><br><font color='#cccccc' size='1'>" + badges[index][2] + "</font>";
	}
	return result;
}

function portalsString() {
	let result = "";
	portalsArray = portals[encodeLocation(X,Y,Z)];
  	methodsArray = portalTravelMethods[encodeLocation(X,Y,Z)];
  	//document.getElementById("overlay").style.display = "none";
	document.getElementById("tooltip").style.backgroundColor = "rgba(0,0,0,0.66)";

	if (isPortal()) {
		result += "<br>";//<br><font size=1 color=#00FF00>Shift-click to cycle through destinations. Click to enter.</font><br>";
	} else {
		portalTargetX = 0;
		portalTargetY = 0;
		portalTargetZ = -1;
	}

	for (let i = 0; i < portalsArray[0]; ++i) {
		decodedTarget = decodeLocation(portalsArray[i + 1]);
		let pointer = whitepointer;
		if ((portalToggle % portalsArray[0]) == i) {
			if (decodedTarget[2] == Z) {
				document.getElementById("signal").style.left = `${decodedTarget[0] * 24 - 12}px`;
				document.getElementById("signal").style.top = `${decodedTarget[1] * 24 - 12}px`;
				//document.getElementById("overlay").style.display = "block";
				document.getElementById("tooltip").style.backgroundColor = "rgba(0,0,0,0.6)";
				/*if (Z == 0 || Z == 3) {
					document.getElementById("overlay").style.width = "1008";
				} else if (Z == 1 || Z == 2) {
					document.getElementById("overlay").style.width = "768";
				} else if (Z == 4) {
					document.getElementById("warrens").style.display = "335";
				} else if (Z == 7) {
					document.getElementById("overlay").style.width = "1247";
					document.getElementById("overlay").style.height = "1247";
				}*/
			}
			portalTargetX = decodedTarget[0];
			portalTargetY = decodedTarget[1];
			portalTargetZ = decodedTarget[2];
			pointer = blackpointer;
		}
		result += "<br>" + pointer + "&nbsp;" + methodsArray[i] + " to " + getLocationString(decodedTarget[0], decodedTarget[1], decodedTarget[2]) + "</font>";
	}
	return result;
}


/**
 *  Returns the location string for a given x, y, z coordinate in the form of (x,y planeName) tileName (a(n) tileType)
 * @param x {Number} X coordinate
 * @param y {Number} Y coordinate
 * @param z {Number} Z coordinate
 * @param display {String} Used for keyMode
 * @returns {String} Stylized (x,y planeName) tileName (a(n) tileType) string
 */
function getLocationString(x, y, z, display) {
	// This is the place for wayward tile descriptions that may not match the map or portal locations
	// if x, y, z specific location, return this location string..
	const tileName = TileNames[encodeLocation(x, y, z)];
	const tileType = `${select_article(TileTypes[encodeLocation(x, y, z)])} ${TileTypes[encodeLocation(x, y, z)]}`;
	if (z == 4 && x == 5 && y == 5) {
		return `[24,40] ${planeName(2)} <span style="font-size: x-small; color: #dddddd">${tileName}</span> <span style="font-size: x-small; color: #dddddd">(${tileType})</span>`;
	} else if (keyMode && display == 'normal') {
		//return "[" + x + "," + y + "] " + planeName(z);
		return `[${x},${y}]`
	} else if (keyMode && display == 'id') {
		return `[${x},${y}] ${planeName(z)} <span style="font-size: x-small; color: #dddddd">${tileName}</span> <span style="font-size: x-small; color: #dddddd">(${tileType})</span>`
	} else if (keyMode && display == 'notvalid') {
		if (TileNames[encodeLocation(x, y, z)] == 'x' && TileTypes[encodeLocation(x, y, z)] == 'x') {
			return `[${x},${y}] ${planeName(z)} <span style="font-size: x-small; color: #dddddd">Twisted Space</span> <span style="font-size: x-small; color: #dddddd">(a twisted space)</span>`
		} else {
			return `[${x},${y}] ${planeName(z)} <span style="font-size: x-small; color: #dddddd">${tileName}</span> <span style="font-size: x-small; color: #dddddd">(${tileType})</span>`
		}
	} else if (z === 6) {
		let adjustedX = x + 19;
		return `[${adjustedX},${y}] ${planeName(z)} <span style="font-size: x-small; color: #dddddd">${tileName}</span> <span style="font-size: x-small; color: #dddddd">(${tileType})</span>`
	} else {
		return `[${x},${y}] ${planeName(z)} <span style="font-size: x-small; color: #dddddd">${tileName}</span> <span style="font-size: x-small; color: #dddddd">(${tileType})</span>`
	}
}

function createPortal(locationArray,methodsArray,costArray) { // Expects two array with the following arguments: first array is [portalLocation,numberOfTargets,target1,target2,...], second array is ["Portal, "Portal", "Ferry"] etc
	let amountTargets = locationArray[1];
	portals[locationArray[0]][0] = locationArray[1];
	for(let i = 0; i < amountTargets; ++i) {
		portals[locationArray[0]][i+1] = locationArray[i+2];
		portalTravelMethods[locationArray[0]][i] = methodsArray[i];
		portalMPCosts[locationArray[0]][i] = costArray[i];
  }
}

function registerTileNames(x,y,z,name) {
	TileNames[encodeLocation(x,y,z)] = "" + name;
}

function registerTileTypes(x,y,z,tiletype) {
	TileTypes[encodeLocation(x,y,z)] = "" + tiletype.toLowerCase();;
}

function registerTileDescription(x,y,z,outside,inside) {
	TileDescriptions[encodeLocation(x,y,z)][0] = "" + outside;
	TileDescriptions[encodeLocation(x,y,z)][1] = "" + inside;
}

function registerBadge(inside,x,y,z,name, desc) {
	badges[encodeLocation(x,y,z)][0] = "" + inside;
	badges[encodeLocation(x,y,z)][1] = "" + name;
	badges[encodeLocation(x,y,z)][2] = "" + desc;
	document.getElementById("badges" + z + "").innerHTML += "<div class='badgeMarker' style='left: " + (x*24-24) + "; top: " + (y*24-24) + ";'><img src='icons/marker_badges.gif'></div>";
}

function initializePortals() {
	//createPortal( [encodeLocation(1,1,4),1,encodeLocation(4,4,2)] , ["Tunnel"], [10]);
}

function initializeBadges() {
	//registerBadge("Outside",7,26,0,"What Once Was Lost", "You have visited the place where a young soul, unable to find  her place in Laurentia, drowned herself to escape it all.");
}

function markAllBadges() {
	let inputString = prompt("Please copy the badge text on your character (below \"Badges earned\" and the \"Release character\" button) and paste it here. \n \n NOTE: This will only show badges that have already been discovered!").toLowerCase();
	if (!showBadges) toggleBadges();
	checkBadges(inputString);
	showhideMarkersPlanechange();
}

function checkBadges(input) {
	for(i = 0; i < badges.length; i++) {
		if ((badges[i][0] != "x") && (input.indexOf(badges[i][1].toLowerCase()) < 0) && (markers[i] == false)) {
			arr = decodeLocation(i);
			toggleMarker(arr[0],arr[1],arr[2]);
		}
	}
}

/**
* Javascript implementation of Dijkstra's algorithm
* Based on: http://en.wikipedia.org/wiki/Dijkstra's_algorithm
* Author: James Jackson (www.jamesdavidjackson.com)
* Source: http://github.com/nojacko/dijkstras-js/tree/
*
* Useage:
*	let d = new Dijkstras();
*	d.setGraph(
*		[
*			['A', [['B', 20], ['C', 20]] ],
*			['B', [['A', 30], ['C', 100]] ],
*			['C', [['D', 10], ['A', 20]] ],
*			['D', [['C', 10], ['B', 20]] ]
*		]
*	);
*	let path = d.getPath('A', 'D');
*
*/

/**
* @class Dijkstras
**/
let Dijkstras = (function () {

    let Dijkstras = function () {
        this.graph = [];
        this.queue;
        this.distance = [];
        this.previous = []
    }

    /**
    * Creates a graph from array.
    * Each element in the array should be in the format:
    * 	[NODE NAME, [[NODE NAME, COST], ...] ]
    *
    * For example: 	[
    *		['A', [['B', 20], ['C', 20]] ],
    *		['B', [['A', 30], ['C', 100]] ],
    *		['C', [['D', 10], ['A', 20]] ],
    *		['D', [['C', 10], ['B', 20]] ]
    *	]
    *
    * @param graphy Array of nodes and vertices.
    **/
    Dijkstras.prototype.setGraph = function (graph)
    {
        // Error check graph
        if (typeof graph !== 'object') {
            throw "graph isn't an object (" + typeof graph + ")";
        }

        if (graph.length < 1) {
            throw "graph is empty";
        }

        for (let index in graph) {
            // Error check each node
            let node = graph[index];
            if (typeof node !== 'object' || node.length !== 2) {
                throw "node must be an array and contain 2 values (name, vertices). Failed at index: " + index;
            }

            let nodeName = node[0];
            let vertices = node[1];
            this.graph[nodeName] = [];

            for (let v in vertices) {
                // Error check each node
                let vertex = vertices[v];
                if (typeof vertex !== 'object' || vertex.length !== 2) {
                    throw "vertex must be an array and contain 2 values (name, vertices). Failed at index: " + index + "[" + v + "]" ;
                }
                let vertexName = vertex[0];
                let vertexCost = vertex[1];
                this.graph[nodeName][vertexName] = vertexCost;
            }
        }
    }

    /**
    * Find shortest path
    *
    * @param source The starting node.
    * @param target The target node.
    * @return array Path to target, or empty array if unable to find path.
    */
    Dijkstras.prototype.getPath = function (source, target)
    {
        // Check source and target exist
        if (typeof this.graph[source] === 'undefined') {
            throw "source " + source + " doesn't exist";
        }
        if (typeof this.graph[target] === 'undefined') {
            throw "target " + target + " doesn't exist";
        }

        // Already at target
        if (source === target) {
            return [];
        }

        // Reset all previous values
        this.queue = new MinHeap();
        this.queue.add(source, 0);
        this.previous[source] = null;

        // Loop all nodes
        let u = null

		let iteration = 0;
        while (u = this.queue.shift()) {
		iteration++;


            // Reached taget!
            if ((u === target) || (TileTypes[parseInt(u)] == pathDestinationType)) {
                let path = [];
                while (this.previous[u] != null) {
                    path.unshift(u);
                    u = this.previous[u];
                }
                return path;
            }



            // all remaining vertices are inaccessible from source
            if (this.queue.getDistance(u) == Infinity) {
                return [];
            }



            let uDistance = this.queue.getDistance(u)
            for (let neighbour in this.graph[u]) {
                let nDistance = this.queue.getDistance(neighbour),
                    aDistance = uDistance + this.graph[u][neighbour];

                if (aDistance < nDistance) {
                    this.queue.update(neighbour, aDistance);
                    this.previous[neighbour] = u;
                }
            }


        }

        return [];

    }



    // Fibonacci Heap (min first)
    let MinHeap = (function() {
        let MinHeap = function () {
            this.min = null;
            this.roots = [];
            this.nodes = [];
        }

        MinHeap.prototype.shift = function()
        {
            let minNode = this.min;


            // Current min is null or no more after it
            if (minNode == null || this.roots.length < 1) {

                this.min = null;
                return minNode
            }


            // Remove it
            this.remove(minNode);



            // Consolidate
            if (this.roots.length > 50000) {
                this.consolidate();
            }

            // Get next min
            let lowestDistance = Infinity,
                length = this.roots.length;

            for (let i = 0; i < length; i++) {
                let node = this.roots[i],
                    distance = this.getDistance(node);

                if (distance < lowestDistance) {
                    lowestDistance = distance;
                    this.min = node;
                }
            }


            return minNode;
        }

        MinHeap.prototype.consolidate = function()
        {
            // Consolidate
            let depths = [ [], [], [], [], [], [], [] ],
                maxDepth = depths.length - 1, // 0-index
                removeFromRoots = [];

            // Populate depths array
            let length = this.roots.length;
            for (let i = 0; i < length; i++) {
                let node = this.roots[i],
                depth = this.nodes[node].depth;

                if (depth < maxDepth) {
                    depths[depth].push(node);
                }
            }

            // Consolidate
            for (let depth = 0; depth <= maxDepth; depth++) {
                while (depths[depth].length > 1) {

                    let first = depths[depth].shift(),
                        second = depths[depth].shift(),
                        newDepth = depth + 1,
                        pos = -1;

                    if (this.nodes[first].distance < this.nodes[second].distance) {
                        this.nodes[first].depth = newDepth;
                        this.nodes[first].children.push(second);
                        this.nodes[second].parent = first;

                        if (newDepth <= maxDepth) {
                            depths[newDepth].push(first);
                        }

                        // Find position in roots where adopted node is
                        pos = this.roots.indexOf(second);

                    } else {
                        this.nodes[second].depth = newDepth;
                        this.nodes[second].children.push(first);
                        this.nodes[first].parent = second;

                        if (newDepth <= maxDepth) {
                            depths[newDepth].push(second);
                        }

                        // Find position in roots where adopted node is
                        pos = this.roots.indexOf(first);
                    }

                    // Remove roots that have been made children
                    if (pos > -1) {
                        this.roots.splice(pos, 1);
                    }
                }
            }
        }

        MinHeap.prototype.add = function(node, distance)
        {
            // Add the node
            this.nodes[node] = {
                node: node,
                distance: distance,
                depth: 0,
                parent: null,
                children: []
            };

            // Is it the minimum?
            if (!this.min || distance < this.nodes[this.min].distance) {
                this.min = node;
            }

            // Other stuff
            this.roots.push(node);
        }

        MinHeap.prototype.update = function(node, distance)
        {
            this.remove(node);
            this.add(node, distance);
        }

        MinHeap.prototype.remove = function(node)
        {
            if (!this.nodes[node]) {
                return;
            }

            // Move children to be children of the parent
            let numChildren = this.nodes[node].children.length;
            if (numChildren > 0) {
                for (let i = 0; i < numChildren; i++) {
                    let child = this.nodes[node].children[i];
                    this.nodes[child].parent = this.nodes[node].parent;

                    // No parent, then add to roots
                    if (this.nodes[child].parent == null) {
                        this.roots.push(child);
                    }
                }
            }

            let parent = this.nodes[node].parent;

            // Root, so remove from roots
            if (parent == null) {
                let pos = this.roots.indexOf(node);
                if (pos > -1) {
                    this.roots.splice(pos, 1);
                }
            } else {
                // Go up the parents and decrease their depth
                while (parent) {
                    this.nodes[parent].depth--;
                    parent = this.nodes[parent].parent
                }
            }
        }

        MinHeap.prototype.getDistance = function(node)
        {
        	if (pathCostModifier(node) == 100.0) {
        		return Infinity;
			}
            if (this.nodes[node]) {
                return this.nodes[node].distance;
            }
            return Infinity;
        }
        return MinHeap;
    })();

    return Dijkstras;
})();

/**
 * Determines the appropriate article to use preceding a given word.
 * @param word The word to check against
 * @returns {string} Returns the article to be used for the given word 'a' or 'an'
 */
function select_article(word) {
	const first_letter = word[0];
	const an_letters = ['a', 'e', 'i', 'o', 'u'];
	const article = (an_letters.includes(first_letter)) ? 'an' : 'a';
	return article;
}


/**
 * Returns the maximum encoded coordinate value based on the planes array.
 * @returns {Number} Maximum encoded coordinate value
 */
function maxEncodedValue() {
	const maxZ = Object.keys(planes).length - 1;
	const maxX = planes[maxZ].size.max_x;
	const maxY = planes[maxZ].size.max_y;
	return encodeLocation(maxX, maxY, maxZ);
}

/**
 * Loads an external file into the running script.
 * @param file
 */
function include(file) {
	const script  = document.createElement('script');
	script.src  = file;
	script.type = 'text/javascript';
	script.defer = true;
	document.getElementsByTagName('head').item(0).appendChild(script);
}


/**
 * Initializes tile names and tile types from external file
 */
function initializeTiles() {
	include('./PortHope_tiles.js');
}
