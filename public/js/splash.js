
function createF() {
    //changes h1
    var sth = document.getElementById("sth-funky");
    sth.textContent = "New Game";

    //create slider folder
    var slidersDiv = document.createElement("div");
    slidersDiv.setAttribute("class", "slidercontainer");
    
    //creates a paragraph for the first slider
    var firstSliderPar = document.createElement("p");
    firstSliderPar.setAttribute("class", "slider-par");
    firstSliderPar.setAttribute("id", "first-par");
    slidersDiv.appendChild(firstSliderPar);

    //create first slider element
    var sliderInput = document.createElement("input");
    sliderInput.setAttribute("type", "range");
    sliderInput.setAttribute("min", "0");
    sliderInput.setAttribute("max", "8");
    sliderInput.setAttribute("value", "4");
    sliderInput.setAttribute("class", "slider");
    sliderInput.setAttribute("id", "time")
    firstSliderPar.appendChild(sliderInput);
    
    //create first value display
    var valString = document.createElement("span");
    var spanVal = document.createTextNode("Game duration: ");
    valString.appendChild(spanVal);
    firstSliderPar.appendChild(valString);

    //basically the same as the above 
    var span = document.createElement("span");
    span.setAttribute("id", "valueOfSlider")
    firstSliderPar.appendChild(span);

    var minutes = document.createElement("span");
    minutes.setAttribute("id", "minutes");
    var sth = document.createTextNode(" minutes");
    firstSliderPar.appendChild(minutes);
    minutes.appendChild(sth);

    //creates a paragraph for the second slider
    var secondSliderPar = document.createElement("p");
    secondSliderPar.setAttribute("class", "slider-par");
    secondSliderPar.setAttribute("id", "second-par");
    slidersDiv.appendChild(secondSliderPar);

    //create second slider element
    var sliderInput2 = document.createElement("input");
    sliderInput2.setAttribute("type", "range");
    sliderInput2.setAttribute("min", "0");
    sliderInput2.setAttribute("max", "8");
    sliderInput2.setAttribute("value", "4");
    sliderInput2.setAttribute("class", "slider");
    sliderInput2.setAttribute("id", "afterMove")
    secondSliderPar.appendChild(sliderInput2);

    //create second value display
    var valString2 = document.createElement("span");
    var spanVal2 = document.createTextNode("Time bonus after each move: ");
    valString2.appendChild(spanVal2);
    secondSliderPar.appendChild(valString2);

    //again... same shit
    var span2 = document.createElement("span");
    span2.setAttribute("id", "valueOfSlider2")
    secondSliderPar.appendChild(span2);

    var seconds = document.createElement("span");
    seconds.setAttribute("id", "seconds");
    var sth2 = document.createTextNode(" seconds");
    secondSliderPar.appendChild(seconds);
    seconds.appendChild(sth2);

    //add the current elements to the body
    var body = document.querySelector(".main-content");
    body.appendChild(slidersDiv);

    //remove menu buttons
    var toBeRemoved = document.querySelector(".start-game");
    var liveToBeRemoved = document.querySelector(".side-content")
    liveToBeRemoved.remove();
    toBeRemoved.remove();

    //show actual value
    var valuesOfSlider1 = [1, 3, 5, 10, 15, 20, 30, 45, 60];
    var slider = document.getElementById("time");
    var output = document.getElementById("valueOfSlider");
    output.innerHTML = valuesOfSlider1[slider.value]; 
    slider.oninput = function() {
    output.innerHTML = valuesOfSlider1[slider.value];
    }

    //show actual value of second slider
    var valuesOfSlider2 = [0, 5, 10, 20, 30, 45, 60, 90, 120]
    var slider2 = document.getElementById("afterMove");
    var output2 = document.getElementById("valueOfSlider2");
    output2.innerHTML = valuesOfSlider2[slider2.value] 
    slider2.oninput = function() {
    output2.innerHTML = valuesOfSlider2[slider2.value];
    }

    //create folder for the figure choice
    var div = document.createElement("div");
    div.setAttribute("class", "game-type");
    slidersDiv.appendChild(div);

    //create first option - blacks
    var para1 = document.createElement("label");
    para1.setAttribute("class", "list-el");
    var text1 = document.createTextNode("Blacks");
    para1.appendChild(text1);
    div.appendChild(para1);
    
    //blacks checkbox
    var blacks = document.createElement("input");
    blacks.setAttribute("type", "checkbox");
    blacks.setAttribute("class", "game-options");
    blacks.setAttribute("id", "blacks");
    blacks.setAttribute("onclick", "blacksCheck()");
    para1.appendChild(blacks);

    //create second option - random
    var para2 = document.createElement("label");
    para2.setAttribute("class", "list-el");
    var text2 = document.createTextNode("Random");
    para2.appendChild(text2);
    div.appendChild(para2);

    //random checkbox
    var random = document.createElement("input");
    random.setAttribute("type", "checkbox");
    random.setAttribute("class", "game-options");
    random.setAttribute("value", "Random");
    random.setAttribute("id", "random");
    random.setAttribute("onclick", "randomCheck()");
    para2.appendChild(random);
    document.getElementById("random").checked = true;

    //create third option - whites
    var para3 = document.createElement("label");
    para3.setAttribute("class", "list-el");
    var text3 = document.createTextNode("Whites");
    para3.appendChild(text3);
    div.appendChild(para3);

    //whites checkbox
    var whites = document.createElement("input");
    whites.setAttribute("type", "checkbox");
    whites.setAttribute("class", "game-options");
    whites.setAttribute("value", "Whites");
    whites.setAttribute("id", "whites");
    whites.setAttribute("onclick", "whitesCheck()");
    para3.appendChild(whites);

    //create control menu part
    var controlMenu = document.createElement("p");
    controlMenu.setAttribute("class", "controls")
    slidersDiv.appendChild(controlMenu);

    //create back button
    var back = document.createElement("input");
    back.setAttribute("type", "button");
    back.setAttribute("value", "Back");
    back.setAttribute("class", "menu-controls");
    back.setAttribute("id", "back-button");
    back.setAttribute("onclick", "backF()");
    controlMenu.appendChild(back);

    //create start game button
    var startBut = document.createElement("input");
    startBut.setAttribute("type", "button");
    startBut.setAttribute("value", "Start Game");
    startBut.setAttribute("class", "menu-controls");
    startBut.setAttribute("id", "start-button");
    startBut.setAttribute("onclick", "startGame()");
    // this should send a from should send a message through the WebSocket declared in client.js (const socket)
    // with the time, increment and side parameters
    // use socket.send(JSON.stringify(message)) where message is a map of these elements
    controlMenu.appendChild(startBut);
}

function joinF() {
    alert("No ongoing games at the moment \\(◕◡◕)/");
}

function backF() {
    //remove all current content
    var toBeRemoved = document.querySelector(".slidercontainer");
    toBeRemoved.remove();

    //changes h1
    var sth = document.getElementById("sth-funky");
    sth.textContent = "Chess";

    //create folder for new stuff
    var mainDiv = document.querySelector(".main-content");

    //create folder for buttons
    var div = document.createElement("div");
    div.setAttribute("class", "start-game");
    mainDiv.appendChild(div);

    //create button
    var create = document.createElement("input");
    create.setAttribute("type", "button");
    create.setAttribute("value", "Create");
    create.setAttribute("class", "game-square");
    create.setAttribute("id", "new-game");
    create.setAttribute("style", "cursor: pointer;");
    create.setAttribute("onclick", "createF()")
    div.appendChild(create);

    //join button
    var join = document.createElement("input");
    join.setAttribute("type", "button");
    join.setAttribute("value", "Join");
    join.setAttribute("class", "game-square");
    join.setAttribute("id", "join-game");
    join.setAttribute("onclick", "joinF()")
    div.appendChild(join);
}

//uncheck all other if blacks is checked
function blacksCheck() {
    if (document.getElementById("blacks").checked) {
        document.getElementById("random").checked = false;
        document.getElementById("whites").checked = false;
    } else {
        document.getElementById("random").checked = true;
    }
}

///uncheck all other if whites is checked
function whitesCheck() {
    if (document.getElementById("whites").checked) {
        document.getElementById("random").checked = false;
        document.getElementById("blacks").checked = false;
    } else {
        document.getElementById("random").checked = true;
    }
}

//uncheck all other if random is checked
function randomCheck() {
    if (document.getElementById("random").checked) {
        document.getElementById("blacks").checked = false;
        document.getElementById("whites").checked = false;
    } else {
        document.getElementById("whites").checked = true;
    }
}

//start
function startGame() {
    //info to send
    var time = document.getElementById("minutes").value;
    var interval = document.getElementById("seconds").value;
    var side = "";

    //other shit
    var whites = document.getElementById("whites");
    var blacks = document.getElementById("blacks");
    if (whites.checked === true) {
        side = "white";
    } else if (blacks.checked === true) {
        side = "black";
    } else {
        side = "random";
    }

    var message = {
        "time": time,
        "interval": interval,
        "side": side
    }

}
