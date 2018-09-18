var noWinner = true;
var playerTurn = 0;
var otherPlayer = 1;
var highscores = localStorage.getItem("highscores");
var player = new Array(new player("player1", 1, 0), new player("player2", 2, 0));
var boardVals = [];
for(var x = 0; x < 2; x++) {
    boardVals[x] = [];
    for(var y = 0; y < 11; y++){
        boardVals[x][y] = [];    
        for(var z = 0; z < 11; z++){
            boardVals[x][y][z] = 0;    
        }
    }
}

function player(name, id, points){
    this.name = name;
    this.id = id;
    this.points = points;

    var hitVals = [];
    for(var x = 0; x < 11; x++) {
        hitVals[x] = [];
        for(var y = 0; y < 11; y++){
            hitVals[x][y] = 0;
        }
    }
    this.hits = hitVals;

    var total = new Array(0,0,0);
    this.totalHits = total;
}
/*
function changeToUserForm() {
    var userInput = document.createElement("input");
    userInput.setAttribute('type', "text");
    userInput.setAttribute('id', "userInput");
    var playButton = document.querySelector("#playForm");
    playButton.insertBefore(userInput, playButton.childNodes[0]);
    playButton.setAttribute('id', "userForm")
    playButton.onsubmit = function(){event.preventDefault(); checkName(0);};
    var inputButton = document.querySelector("#inputButton");
    inputButton.value = "Submit";
    setName(0);
}*/
function selectionPrompt(playerNum) {
    document.querySelector("#userForm").reset();
    document.querySelector("#userForm").onsubmit = function(){event.preventDefault(); checkStrings(playerNum);};
    document.querySelector("#status2").innerHTML = "";
    document.querySelector("#status").innerHTML = "Type in your name and ship placements, Player " + (playerNum + 1);
}

function checkStrings(playerNum) {
    player[playerNum].name = document.querySelector("#nameInput").value;
    var shipPlacements = document.querySelector("#shipInput").value;
    var nameRules = /[\w]{1,10}/i;
    var shipRules = /((|\s)[abs](:|\()[a-j]([1-9]|10?)-[a-j]([1-9]|10?)(|\))(|;)){3}/ig;

    if(nameRules.test(player[playerNum].name)) {
        if(shipRules.test(shipPlacements)) {
            var ship = shipPlacements.split(";");
            ship.length = 3;
            for(x in ship) {
                placeShip(playerNum, ship[x].trim().toUpperCase());
            }
            if(playerNum == 0) {
                selectionPrompt(1);
            }
            else if(playerNum == 1) {
                startGame();
            }
        }
        else {
            alert("Ship placements not valid. Choose an acceptable string.\nFor example: A:A1-A5;B:B6-E6; S:H3-J3")
        }
    }
    else {
        alert("Name not valid. Choose an acceptable name.");
    }
}

function createTables() {
    setupHighscores();
    var letters = [' ','A','B','C','D','E','F','G','H','I','J'];
    var parent = document.querySelector(".table1");
    var table  = document.createElement('table');
    table.setAttribute('id', 'table1')
    parent.appendChild(table);
    parent = document.querySelector(".table2");
    table  = document.createElement('table');
    table.setAttribute('id', 'table2')
    parent.appendChild(table);
    for (var i = 0; i < 11 ; i++) {
        var row = document.createElement('tr');
        row.setAttribute('rowIndex', i);
        for (var j = 0; j < 11; j++ ) {
            var cell = document.createElement('td');
            if(i == 0) {
                cell.innerHTML = letters[j];
            }
            else if(j == 0) {
                cell.innerHTML = i;
            }
            else{
                cell.addEventListener('click', function() {addCheckFire(this.parentNode.rowIndex, this.cellIndex,playerTurn, otherPlayer);});
            }
            cell.setAttribute('cellIndex', j);
            row.appendChild(cell);
        }
        document.querySelector("#table1").appendChild(row);
        document.querySelector("#table2").appendChild(row.cloneNode(true));
    }
    var currentTable = document.querySelector("#table1");
    for (var i = 0, row; row = currentTable.rows[i]; i++) {
        for (var j = 0, cell; cell = row.cells[j]; j++) {
            if(i != 0 && j != 0) {
                cell.setAttribute('style', 'cursor:pointer;');
                cell.setAttribute('id', "shadeable");
            }
        }  
    }
    currentTable = document.querySelector("#table2");
    for (var i = 0, row; row = currentTable.rows[i]; i++) {
        for (var j = 0, cell; cell = row.cells[j]; j++) {
            cell.setAttribute('style', 'cursor:default;');
        }  
    }
    setTableTwo(0);
}

function addCheckFire(rIndex, cIndex, playerNum, otherPlayer) {
    if(cIndex != 0 && rIndex != 0) {
        if(checkFire(playerNum, rIndex, cIndex)) {
            player[otherPlayer].points -= 2;
            document.querySelector("#status2").innerHTML = player[0].name + "'s points: " + player[0].points + "\t" + player[1].name + "'s points: " + player[1].points;
            document.querySelector("#table1").rows[rIndex].cells[cIndex].setAttribute('id', "hit");
            player[otherPlayer].hits[rIndex][cIndex] = -1;
            if(player[otherPlayer].hits[rIndex][cIndex] == -1){
                setTimeout(function(){
                    if(confirm("Hit at: " + String.fromCharCode(cIndex + 64) + rIndex)){
                        checkIfWon(rIndex, cIndex);
                        continueGame(otherPlayer);
                    }
                }, 10);
            }
        }
        else {
            document.querySelector("#table1").rows[rIndex].cells[cIndex].setAttribute('id', "miss");
            player[otherPlayer].hits[rIndex][cIndex] = 1;
            if(player[otherPlayer].hits[rIndex][cIndex] == 1){
                setTimeout(function(){
                    if(confirm("Miss at: " + String.fromCharCode(cIndex + 64) + rIndex)){
                        hideTables();
                        continueGame(otherPlayer);
                    }
                }, 10);
            }
        }
    }
}

function promptShips(playerNum) {
    document.querySelector("#status").innerHTML = "Welcome to the battle, " + player[playerNum].name + " AKA Player " + player[playerNum].id;
    document.querySelector("#status2").innerHTML = "Type in your ship placements:";
    document.querySelector("#userForm").reset();
    if(playerNum == 0) {
        document.querySelector("#userForm").onsubmit = function(){event.preventDefault(); setShips(0);};
    }
    else {
        document.querySelector("#userForm").onsubmit = function(){event.preventDefault(); setShips(1);};
    }
}

function placeShip(playerNum, ship)
{
    if(ship.charCodeAt(0) < 67) {
        if(ship.charAt(2) == ship.charAt(5)) {
            for(i = 0; i < 6 - (ship.charCodeAt(0) - 64); i++) {
                boardVals[playerNum][ship.charCodeAt(3) - 48 + i][ship.charCodeAt(2) - 64] = ship.charCodeAt(0) - 84;
            }
        }
        else{
            for(i = 0; i < 6 - (ship.charCodeAt(0) - 64); i++) {
                boardVals[playerNum][ship.charCodeAt(3) - 48][ship.charCodeAt(2) - 64 + i] = ship.charCodeAt(0) - 84;
            }
        }
    }
    else {
        if(ship.charAt(2) == ship.charAt(5)) {
            for(i = 0; i < 4; i++) {
                boardVals[playerNum][ship.charCodeAt(3) - 48 + i][ship.charCodeAt(2) - 64] = ship.charCodeAt(0) - 84;
            }
        }
        else{
            for(i = 0; i < 4; i++) {
                boardVals[playerNum][ship.charCodeAt(3) - 48][ship.charCodeAt(2) - 64 + i] = ship.charCodeAt(0) - 84;
            }
        }
    }
}

function startGame() {
    document.querySelector("#status").innerHTML = "Select your target on the board, " + player[0].name;
    document.querySelector("#status2").innerHTML = player[0].name + "'s points: " + player[0].points + "\t" + player[1].name + "'s points: " + player[1].points;
    document.querySelector("#userForm").remove();
    playerNum = 0;
    alert("Click to start " + player[0].name + "'s turn!");
    createTables()
}

function continueGame(playerNum) {
    if(noWinner) {
        hideTables();
        if(document.querySelector("#table2").style.display = "none") {
            if(playerNum == 0){
                playerTurn = 0;
                otherPlayer = 1;
            }
            else{
                playerTurn = 1;
                otherPlayer = 0;
            }
            setTimeout(function() {
                if(confirm("Click to start " + player[playerNum].name + "'s turn!")){}
                showTables(playerNum);
                setTableOne(playerNum);
                setTableTwo(playerNum);
            }, 10);
        }
    }
    else {
        alert(player[playerTurn].name + " has won!");
        if(highscores == null)
        {
            highscores = "Top 10 Local Highscores;"; 
        }
        
        var scores = highscores.split(";");
        if(scores[1] == "") {
            scores[1] = player[playerTurn].name + ":" + player[playerTurn].points + ";";
        }
        else {
            var score;
            for(var i = 1; i < scores.length; i++){
                if(scores[i] != "") {
                    score = scores[i].split(":");
                    if(player[playerTurn].points > score[1]){
                        scores.splice(i, 0, player[playerTurn].name + ":" + player[playerTurn].points);
                        break;
                    }
                }
                else {
                    scores.splice(i, 0, player[playerTurn].name + ":" + player[playerTurn].points);
                    break;
                }
            }
        }
        
        highscores = "";
        if(scores.length == 12){
            scores.length--;
        }
        for(x in scores)
        {
            if(x == scores.length - 1) {
                highscores += scores[x];
            }
            else {
                highscores += scores[x] + ";";
            }
        }
        localStorage.setItem("highscores", highscores);
        table = document.querySelector("#table3");
        while(table.firstChild){
            table.removeChild(table.firstChild);
        }
        setupHighscores();
    }
}

function setWin(){
    player[0].points = 26;
    noWinner = false;
    continueGame(0);
}

function checkIfWon(rIndex, cIndex) {
    console.log(player[playerTurn].name + ": " + player[otherPlayer].totalHits);
    if(boardVals[otherPlayer][rIndex][cIndex] == -1 && player[otherPlayer].totalHits[2] != 3) {
        player[otherPlayer].totalHits[2]++;
        if(player[otherPlayer].totalHits[2] == 3){
            alert("You sank " + player[otherPlayer].name + "'s submarine!");
            player[playerTurn].points += 6;
            document.querySelector("#status2").innerHTML = player[0].name + "'s points: " + player[0].points + "\t" + player[1].name + "'s points: " + player[1].points;
        }
    }
    else if(boardVals[otherPlayer][rIndex][cIndex] == -18 && player[otherPlayer].totalHits[1] != 4) {
        player[otherPlayer].totalHits[1]++;
        if(player[otherPlayer].totalHits[1] == 4){
            alert("You sank " + player[otherPlayer].name + "'s battleship!");
            player[playerTurn].points += 8;
            document.querySelector("#status2").innerHTML = player[0].name + "'s points: " + player[0].points + "\t" + player[1].name + "'s points: " + player[1].points;
        }
    }
    else if(boardVals[otherPlayer][rIndex][cIndex] == -19 && player[otherPlayer].totalHits[0] != 5) {
        player[otherPlayer].totalHits[0]++;
        if(player[otherPlayer].totalHits[0] == 5){
            alert("You sank " + player[otherPlayer].name + "'s aircraft carrier!");
            player[playerTurn].points += 10;
            document.querySelector("#status2").innerHTML = player[0].name + "'s points: " + player[0].points + "\t" + player[1].name + "'s points: " + player[1].points;
        }
    }
    if(player[otherPlayer].totalHits[2] == 3 && player[otherPlayer].totalHits[1] == 4 && player[otherPlayer].totalHits[0] == 5) {
        noWinner = false;
    }
    return true;
}

function hideTables()
{
    table = document.querySelector("#table1");
    table.style.display = "none";
    table = document.querySelector("#table2");
    table.style.display = "none";
    document.querySelector("#status").innerHTML  = "Waiting for confirmation...";
}

function showTables(playerNum)
{
    table = document.querySelector("#table1");
    table.style.display = "table";
    table = document.querySelector("#table2");
    table.style.display = "table";
    document.querySelector("#status").innerHTML = "Select your target on the board, " + player[playerNum].name;
}

function setTableOne(playerNum)
{
    var target;
    playerNum == 0 ? target = 1 : target = 0;
    table = document.querySelector("#table1")
    for (var i = 0, row; row = table.rows[i]; i++) {
        for (var j = 0, cell; cell = row.cells[j]; j++) {
            if(i != 0 && j != 0) {
                if(player[target].hits[i][j] == 0){
                    cell.setAttribute('id', "shadeable");
                }
                else if(player[target].hits[i][j] == -1){
                    cell.setAttribute('id', "hit");
                }
                else if(player[target].hits[i][j] == 1){
                    cell.setAttribute('id', "miss");
                }
            }
        }
    }
}

function setTableTwo(playerNum)
{
    table = document.querySelector("#table2")
    for (var i = 1, row; row = table.rows[i]; i++) {
        for (var j = 1, cell; cell = row.cells[j]; j++) {
            if(boardVals[playerNum][i][j] == -1){
                cell.innerHTML = "S";
            }
            else if(boardVals[playerNum][i][j] == -18){
                cell.innerHTML = "B";
            }
            else if(boardVals[playerNum][i][j] == -19){
                cell.innerHTML = "A";
            }
            else{
                cell.innerHTML = "";
            }
        }
    }
}

function checkFire(player, row, collumn) {
    var target;
    player == 1 ? target = 0 : target = 1;
    if(boardVals[target][row][collumn] != 0){
        return true;
    }
    else
        return false;
}

function setupHighscores() {
    parent = document.querySelector(".table3");
    if(!parent.firstChild){
        table = document.createElement("table3");
    }
    else {
        table = parent.firstChild;
    }
    table.setAttribute('id', "table3");
    parent.appendChild(table);

    if(highscores !== null)
    {
        var scores = highscores.split(";")

        for(x in scores) {
            var row = document.createElement('tr');
            row.setAttribute('rowIndex', x);
            row.innerHTML = scores[x];
            table.append(row);
        }
    }
}