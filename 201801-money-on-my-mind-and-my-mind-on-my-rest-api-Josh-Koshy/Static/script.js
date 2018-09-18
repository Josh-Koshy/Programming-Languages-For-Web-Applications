var thisCat = 0, holder = 0;
var white = /[\S]+/g;
var today = new Date();
var catsArr = [{id:0, name:"All", value:0}];
var purArr = [];

function setup() {
    document.getElementById("month").addEventListener("change", refillPurchs, true);
	document.getElementById("modCat").addEventListener("change", modCatChange, true);
	document.getElementById("modPur").addEventListener("change", modPurChange, true);
	document.getElementById("year").value = today.getFullYear();
	document.getElementById("month").value = today.getMonth()+1;
	document.getElementById("datePur").value = today.getFullYear() + "-" + (today.getMonth()+1) + "-" + today.getDate();
	document.getElementById("modDate").value = today.getFullYear() + "-" + (today.getMonth()+1) + "-" + today.getDate();
	document.getElementById("year").addEventListener("change", refillPurchs, true);
	document.getElementById("catBut").addEventListener("click", addCat, true);
	document.getElementById("purBut").addEventListener("click", addPur, true);
	document.getElementById("modPurBut").addEventListener("click", modPur, true);
	document.getElementById("delCatBut").addEventListener("click", delCat, true);
	document.getElementById("delPurBut").addEventListener("click", delPur, true);
	document.getElementById("modCatBut").addEventListener("click", modCat, true);


	purchPoller();  
	categoryPoller();
}

function handle(e, i){
	var func = [addCat, modCat, delCat, addPur, modPur, delPur];
	if(e.keyCode === 13) {
		e.preventDefault();
		func[i]();
	}
}

function makeReq(method, target, retCode, action, data) {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		alert('Error: Cannot create an XMLHTTP instance');
		return false;
	}

	httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, action);
	httpRequest.open(method, target);
	
	if (data){
		httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		httpRequest.send(data);
	}
	else {
		httpRequest.send();
	}
}

function makeHandler(httpRequest, retCode, action) {
	function handler() {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === retCode) {
				console.log("Received response:  " + httpRequest.responseText);
				action(httpRequest.responseText);
			} 
			else {
				alert("There was a problem with the request. Refresh the page.");
			}
		}
	}
	return handler;
}

function categoryPoller() {
	makeReq("GET", "/cats", 200, repopCategory);
}

function purchPoller() {
	makeReq("GET", "/purchases", 200, repopPurch);
}

function filterByCategory(pur) {
	return pur.cat == thisCat;
}

function toUncat(pur) {
	if (pur.cat == holder) {
		pur.cat = 1;
	}
}

function getSum(total, pur) {
	total = parseFloat(total) + parseFloat(pur.value);
	return total;
}

function findObj(obj) {
	return obj.id == holder;
}

function filterOut(obj) {
	return obj.id != holder;
}

function sortByDate(a, b) {
	return new Date(a.date) - new Date(b.date);
}

function notZero(amt) {
	if (amt == 0) {
		amt = 0.01
	}
	return amt;
}

function changeCat(cat, name) {
	document.getElementById("catTitle").innerHTML = name;

	thisCat = cat;

	refillPurchs();
}

function addCat() {
	var newCat = document.getElementById("newCat").value;
	var newPurch = document.getElementById("newBud").value;

	newPurch = notZero(newPurch);

	var data = "name=" + newCat + "&value=" + newPurch;

	if (white.test(newCat)) {
		makeReq("POST", "/cats", 201, repopCategory, data);
	}
	else {
		alert("Enter a name for your category");
	}

	document.getElementById("newCat").value = "Name";
	document.getElementById("newBud").value = newPurch;
}

function addPur() {
    var catPur = document.getElementById("catPur").value;
	var datePur = document.getElementById("datePur").value;
	var descPur = document.getElementById("descPur").value;
	var valuePur = document.getElementById("valuePur").value;

	valuePur = notZero(valuePur);

	var data = "description=" + descPur + "&value=" + valuePur + "&category=" + catPur + "&date=" + datePur;

	if (white.test(descPur)) {
		makeReq("POST", "/purchases", 201, repopPurch, data);
	}
	else {
		alert("Enter a description for your purchase");
	}

	document.getElementById("descPur").value = "Description";
	document.getElementById("valuePur").value = valuePur;
	document.getElementById("catPur").value = catPur;
	datePur = document.getElementById("datePur").value = datePur;
}

function modCat() {
	var cat = document.getElementById("modCat").value;
	var value = document.getElementById("modBud").value;

	value = notZero(value);

	holder = cat;
	var i = catsArr.findIndex(findObj);

	var data = "name=" + cat + "&value=" + value;

	if (cat != "") {
		catsArr[i].value = value;
		makeReq("PUT", "/cats", 201, refillPurchs, data);
	}
	else {
		alert("Select a category first");
	}

	document.getElementById("modCat").value = cat;
	document.getElementById("modBud").value = value;
}

function modPur() {
	var pur = document.getElementById("modPur").value;
	var cat = document.getElementById("modCatPur").value;
	var value = document.getElementById("modAmnt").value;
	var date = document.getElementById("modDate").value;

	value = notZero(value);

	holder = pur;
	var i = purArr.findIndex(findObj);

	var data = "description=" + pur  + "&value=" + value + "&category=" + cat + "&date=" + date;

	if (pur != "") {
		purArr[i].cat = cat;
		purArr[i].value = value;
		purArr[i].date = date;
		makeReq("PUT", "/purchases", 201, refillPurchs, data);
	}
	else {
		alert("Select a purchase first");
	}

	document.getElementById("modPur").value = pur;
	document.getElementById("modCatPur").value = cat;
	document.getElementById("modAmnt").value = value;
	document.getElementById("modDate").value = date;
}

function repopCategory(responseText) {
	console.log("Repopulating Categories!");
	var cats;

	if (responseText != "") {
		cats = JSON.parse(responseText);

		if (cats.length) {
			for (var c = 0; c < cats.length; c++) {
				catsArr.push({id:cats[c]["c_id"], name:cats[c]["name"], value:cats[c]["value"]});
			}
		}
		else {
			catsArr.push({id:cats["c_id"], name:cats["name"], value:cats["value"]});
		}
	}

	catsArr.forEach(refillCategories);
	refillPurchs();
}

function repopPurch(responseText) {
	console.log("Purchases updating");

	if (responseText != "") {
		var purchs = JSON.parse(responseText);

		if (purchs.length) {
			for (var p = 0; p < purchs.length; p++) {
				purArr.push({
					id:purchs[p]["p_id"],
					desc:purchs[p]["description"],
					value:purchs[p]["value"],
					cat:purchs[p]["category"],
					date:purchs[p]["date"]
				});
			}
		}
		else {
			purArr.push({
				id:purchs["p_id"],
				desc:purchs["description"],
				value:purchs["value"],
				cat:purchs["category"],
				date:purchs["date"]
			});
		}
	}

	refillPurchs();
}

function refillCategories(cat) {
    var delCat = document.getElementById("delCat");
	var modCat = document.getElementById("modCat");
	var listI = document.createElement("li");
	var button = document.createElement("input");
	var catDisp = document.getElementById("catDisp");
	var catPur = document.getElementById("catPur");
	var modCatPur = document.getElementById("modCatPur");


	if (cat.id == 0){
		catDisp.innerHTML = "";
		catPur.innerHTML = "";
		modCatPur.innerHTML = "";

		delCat.innerHTML = "<option value=''>&nbsp;</option>";
		modCat.innerHTML = "<option value=''>&nbsp;</option>";
	}
	else {
		catPur.innerHTML = catPur.innerHTML + "&#10" + "<option value='" + cat.id + "'>" + cat.name + "</option>";
		modCatPur.innerHTML = modCatPur.innerHTML + "&#10" + "<option value='" + cat.id + "'>" + cat.name + "</option>";

		if (cat.id != 1) {
			delCat.innerHTML = delCat.innerHTML + "&#10" + "<option value='" + cat.id + "'>" + cat.name + "</option>";
			modCat.innerHTML = modCat.innerHTML + "&#10" + "<option value='" + cat.id + "'>" + cat.name + "</option>";
		}
	}

	button.setAttribute("type", "button");
	button.setAttribute("value", cat.name);
	button.setAttribute("onclick", "changeCat(" + cat.id + ", '" + cat.name + "')");

	listI.appendChild(button);
	catDisp.appendChild(listI);
}

function refillPurchs() {
    var modPur = document.getElementById("modPur");
	var frame = document.getElementById("purDisp");
	var delPur = document.getElementById("delPur");
	var purs = purArr.filter(filterByDate);
	delPur.innerHTML = "<option value=''> </option>";
	modPur.innerHTML = "<option value=''> </option>";
	frame.innerHTML = "";

	if (thisCat == 0) {
		for (var c = catsArr.length-1; c > 0; c--) {
		    var left = document.createElement("span");
			var leftOver = document.createElement("span");
			var over = document.createElement("span");
			var total = 0;
			var unord = document.createElement("ul");
			var title = document.createElement("h3");
			var info = document.createElement("span");

			thisCat = catsArr[c].id;
			var pursFor = purs.filter(filterByCategory);
			pursFor = pursFor.sort(sortByDate);

			if (pursFor.length > 0) {
				total = pursFor.reduce(getSum, 0);
			}

			title.innerHTML = catsArr[c].name;

			if (catsArr[c].id == 1){
				info.innerHTML = "<b>Total Spent: " + parseFloat(total).toFixed(2) + "</b>";
				left.innerHTML = "";
				leftOver.innerHTML = "";
				over.innerHTML = "";
			}
			else {
				over.innerHTML = (parseFloat(catsArr[c].value) - parseFloat(total)).toFixed(2);
				left.innerHTML = (parseFloat(total) / parseFloat(catsArr[c].value) * 100).toFixed(2);

				if (parseFloat(over.innerHTML) < 0) {
					over.setAttribute("style", "color:red; font-weight:bold;");
					left.setAttribute("style", "color:red; font-weight:bold;");
				}
				else {
					over.setAttribute("style", "font-weight:bold;");
					left.setAttribute("style", "font-weight:bold;");
				}
				left.innerHTML = left.innerHTML + "%";
				info.innerHTML = "<b>Budget: " + parseFloat(catsArr[c].value).toFixed(2) + " \u00A0\u00A0 - \u00A0\u00A0 Total Spent: " + parseFloat(total).toFixed(2) + " \u00A0\u00A0 - \u00A0\u00A0 Used: <b/>";
				leftOver.innerHTML = "<b> \u00A0\u00A0 - \u00A0\u00A0 Left: </b>"
			}

			for (var p = 0; p < pursFor.length; p++) {
				var listI = document.createElement("li");
				var text = document.createTextNode(pursFor[p].date + ": \u00A0\u00A0 " + pursFor[p].desc + "\u00A0\u00A0\u00A0 - \u00A0\u00A0\u00A0" + parseFloat(pursFor[p].value).toFixed(2));

				listI.appendChild(text);
				unord.appendChild(listI);

				delPur.innerHTML = delPur.innerHTML + "&#10" + "<option value='" + pursFor[p].id + "'>" + pursFor[p].date + ": \u00A0" + pursFor[p].desc + "\u00A0 - \u00A0" + parseFloat(pursFor[p].value).toFixed(2) + "</option>";
				modPur.innerHTML = modPur.innerHTML + "&#10" + "<option value='" + pursFor[p].id + "'>" + pursFor[p].date + ": \u00A0" + pursFor[p].desc + "\u00A0 - \u00A0" + parseFloat(pursFor[p].value).toFixed(2) + "</option>";
			}

			if (!pursFor.length) {
				unord.innerHTML = "<li>No purchases yet</li>";
			}

			frame.appendChild(title);
			frame.appendChild(info);
			frame.appendChild(left);
			frame.appendChild(leftOver);
			frame.appendChild(over);
			frame.appendChild(unord);
			frame.innerHTML = frame.innerHTML + "<br />";
		}

		thisCat = 0;
	}
	else {
		var unord = document.createElement("ul");
		var title = document.createElement("h3");
		var info = document.createElement("span");
		var left = document.createElement("span");
		var leftOver = document.createElement("span");
		var over = document.createElement("span");
		var total = 0;

		cat = catsArr.find(findObj);
		purs = purs.filter(filterByCategory);
		purs = purs.sort(sortByDate);

		if (purs.length > 0) {
			total = purs.reduce(getSum, 0);
		}

		title.innerHTML = cat.name;

		if (cat.id == 1){
			info.innerHTML = "<b>Total Spent: " + parseFloat(total).toFixed(2) + "</b>";
			left.innerHTML = "";
			leftOver.innerHTML = "";
			over.innerHTML = "";
		}
		else {
			over.innerHTML = (parseFloat(cat.value) - parseFloat(total)).toFixed(2);
			left.innerHTML = (parseFloat(total) / parseFloat(cat.value) * 100).toFixed(2);

			if (parseFloat(over.innerHTML) < 0) {
				over.setAttribute("style", "color:red; font-weight:bold;");
				left.setAttribute("style", "color:red; font-weight:bold;");
			}
			else {
				over.setAttribute("style", "font-weight:bold;");
				left.setAttribute("style", "font-weight:bold;");
			}

			info.innerHTML = "<b>Budget: " + parseFloat(cat.value).toFixed(2) + " \u00A0\u00A0 - \u00A0\u00A0 Total Spent: " + parseFloat(total).toFixed(2) + " \u00A0\u00A0 - \u00A0\u00A0 Used: <b/>";
			leftOver.innerHTML = "<b>% \u00A0\u00A0 - \u00A0\u00A0 Left: </b>"
		}

		for (var p = 0; p < purs.length; p++) {
			var listI = document.createElement("li");
			var text = document.createTextNode(purs[p].date + ": \u00A0\u00A0 " + purs[p].desc + "\u00A0\u00A0\u00A0 - \u00A0\u00A0\u00A0" + parseFloat(purs[p].value).toFixed(2));

			listI.appendChild(text);
			unord.appendChild(listI);

			delPur.innerHTML = delPur.innerHTML + "&#10" + "<option value='" + purs[p].id + "'>" + purs[p].date + ": \u00A0" + purs[p].desc + "\u00A0 - \u00A0" + parseFloat(purs[p].value).toFixed(2) + "</option>";
			modPur.innerHTML = modPur.innerHTML + "&#10" + "<option value='" + purs[p].id + "'>" + purs[p].date + ": \u00A0" + purs[p].desc + "\u00A0 - \u00A0" + parseFloat(purs[p].value).toFixed(2)+ "</option>";
		}

		if (!purs.length) {
			unord.innerHTML = "<li>No Purchases in this Category.</li>";
		}

		frame.appendChild(title);
		frame.appendChild(info);
		frame.appendChild(left);
		frame.appendChild(leftOver);
		frame.appendChild(over);
		frame.appendChild(unord);
	}
}

function delCat() {
	var cat = document.getElementById("delCat").value;

	var data = "name=" + cat + "&value=" + 0;

	if (cat != "") {
		holder = cat;
		catsArr = catsArr.filter(filterOut);

		purArr.forEach(toUncat);

		makeReq("DELETE", "/cats", 204, repopCategory, data);
	}
	else {
		alert("Select a date first");
	}
}

function delPur() {
	var pur = document.getElementById("delPur").value;

	var data = "description=" + pur  + "&value=" + 0 + "&category=" + 0 + "&date=" + 0;

	if (pur != "") {
		holder = pur;
		purArr = purArr.filter(filterOut);

		makeReq("DELETE", "/purchases", 204, refillPurchs, data);
	}
	else {
		alert("Select a purchase first");
	}
}

function modCatChange() {
	cat = document.getElementById("modCat").value;
	box = document.getElementById("modBud");

	holder = cat;
	var i = catsArr.findIndex(findObj);

	box.value = catsArr[i].value;
}

function modPurChange() {
	pur = document.getElementById("modPur").value;
	valueBox = document.getElementById("modAmnt");
	catBox = document.getElementById("modCatPur");
	dateBox = document.getElementById("modDate");

	holder = pur;
	var i = purArr.findIndex(findObj);

	valueBox.value = purArr[i].value;
	catBox.value = purArr[i].cat;
	dateBox.value = purArr[i].date;
}

function filterByDate(pur) {
	if (pur.date) {
		var year = document.getElementById("year").value;
		var month = document.getElementById("month").value;
		var date = pur.date.split("-");

		return date[0] == year && date[1] == month;
	}
}


window.addEventListener("load", setup, true);
