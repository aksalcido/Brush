const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const colors = document.querySelectorAll(".paint");
const toolContainer = document.querySelector(".tools-container");

// Represents the current color the brush has equipped
const colorDisplay = document.querySelector("#color-display");

// Input Sliders
const toolSliders = document.querySelectorAll(".tool-slider");
const widthSlider = document.querySelector("#line-width");
const transparencySlider = document.querySelector("#transparency");
const customRGBSliders = document.querySelectorAll(".custom-rgb");

// Check boxes
const lineCheckboxes = document.querySelectorAll(".brush-checkbox");

// Buttons 
const saveButton  = document.querySelector('#save');
const undoButton  = document.querySelector("#undo");
const redoButton  = document.querySelector("#redo");
const clearButton = document.querySelector('#clear');
const hideButton  = document.querySelector("#hide");

// Tools
const paintBrushButton  = document.querySelector("#paint-brush");
const fillBucketButton  = document.querySelector("#fill-bucket");
const colorPickerButton = document.querySelector("#color-picker");

const shapePickerButton = document.querySelector("#shape-picker");

//const horizontalDisplay = document.querySelector(".horizontal-display");
const fRectangleButton  = document.querySelector("#filledRectangle");
const sRectangleButton  = document.querySelector("#strokedRectangle");

const clickPoint = document.querySelector(".shape-click");

// Dropdown and Content
const effectsDropdownButton = document.querySelector(".dropbtn");
const effectsOptions = document.querySelectorAll("#effects-dropdown a");

// Custom Effects
const rainbowButton = document.querySelector("#rainbow");
const directionalButton = document.querySelector("#directional");
const invertButton = document.querySelector("#invert");

// GLOBAL Drawing Variables
let lastX     = 0;
let lastY     = 0;
let isDrawing = false;
let currentTool = paintBrushButton; // by default our currentTool is equal to our paint brush
let currentColor = null;

// Custom Effects Variables
let customEffects = [];
let hue = 0;
let direction = true;

// Local Storage Keys
const canvasName = "brushCanvas";
const previousName = "previousCanvas";
const lastUsedColor = "lastUsedColor";


var previousCanvas = localStorage.getItem(previousName) || null;

// Represents the State of the Program and allows the User to undo/redo up to 'max' amount of turns
const State = {
    states: [previousCanvas],
    index: 0,
    max: 5
};

// Initialize the Program
init();

/* ============================== User Tool Methods ============================== */
function draw(event) {
    //console.log(isDrawing);
    if (!isDrawing) 
        return;
    
    // Custom Effects are ran here if Any
    handleCustomEffects();

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();

    [lastX, lastY] = [event.offsetX, event.offsetY];
}

function fill(c, r) {
    console.log('Filled called');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    var pixel = ctx.getImageData(c, r, 1, 1);
    var pixelData = pixel.data;
    console.log(pixelData);
    const ocolor = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3]})`;


    for(var i = 0; i < 2000; i += 4) {
        data[i] = 130;
        data[i + 1] = 40;
        data[i + 2] = 40;
    }

    ctx.putImageData(imageData, 0, 0, dirtyWidth=500, dirtyHeight=1000);

    //fillPixel(data, c, r, ocolor, ctx.strokeStyle);
}

function fillPixel(data, c, r, ocolor, ncolor) {
    console.log("ocolor: " + ocolor);
    console.log("ncolor: " + ncolor);

    for(var i = 0; i < canvas.height; i += 4) {
        data[i] = 130;
        data[i + 1] = 40;
        data[i + 2] = 40;
    }
}

// Pick Color based off Clicked Pixel on Canvas //
function pick(c, r) {
    var pixel = ctx.getImageData(c, r, 1, 1);
    var data = pixel.data; // represents the rgba
    var rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3]})`;
    changeColor(rgba);
}


function drawShape(ex, ey, c, r) {    
    if (lastX === 0 && lastY === 0) {
        // First Point clicked
        [lastX, lastY] = [c, r];

        // Draw Temporary Point to indicate where the User's first rectangle click was
        clickPoint.style.top = `${ey}px`;
        clickPoint.style.left = `${ex}px`;
        clickPoint.classList.remove('hidden');
    } 
    else {
        // Saves the Canvas before the Rectangle is drawn for our Undo functionality -- Allows User to revert from drawn shape
        savePreviousCanvas();
        localStorage.setItem(previousName, previousCanvas);

        if (currentTool.dataset.tool === 'filledRectangle') {
            ctx.beginPath();
            ctx.rect(lastX, lastY, c - lastX, r - lastY);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
        }
        else if (currentTool.dataset.tool === 'strokedRectangle') {
            ctx.strokeRect(lastX, lastY, c - lastX, r - lastY);
        }

        // Sets the Coordinates for initial point back to default: [0, 0]
        [lastX, lastY] = [0, 0];
        clickPoint.classList.add('hidden');
    }
}

/* ============================== Custom Effects Methods ============================== */
/* Handles the calls for Custom Effects currently active in the 'customEffects' array. Since multiple effects can be active at a time, we iterate and call the functionality respectively for the given effect. */
function handleCustomEffects() {
    customEffects.forEach(effect => {
        if (effect === directionalButton.dataset.effect) {
            dynamicWidth();
        }
        else if (effect === rainbowButton.dataset.effect) {
            rainbow();
        }
        else if (effect === "cust") {
            testCustom();
        }
        else {
            
        }
    });
}

/* Functionality for the Dynamic Width Brush option, is called when User is drawing, and increments/decrements when the a width of 1 or 100 has been reached */
function dynamicWidth() {
    if (ctx.lineWidth >= 100 || ctx.lineWidth <= 1)
        direction = !direction;
    
    if (direction)
        ctx.lineWidth++;
    else
        ctx.lineWidth--;
}

/* Functionality for the Rainbow Brush Option, is called when User is drawing, which uses hsl to change the color of the brush as the hue increments up to 360 and cycles again starting from 0. */
function rainbow() {
    colorDisplay.style.background = `hsl(${hue}, 100%, 50%)`;
    ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
    hue++;

    if (hue >= 360)
        hue = 0;
}

/* Functionality for the Invert button, uses the 'difference' globalCOmpositeOperation and redraws whats on the canvas with it, then reverts back to the previous Brush Style of the User. */
function invert() {
    var img = new Image;
    img.src = canvas.toDataURL();
    ctx.drawImage(img,0,0);

    // Store the current Brush
    const currentCompositeOperation = ctx.globalCompositeOperation;

    // Used to redraw everything that is displayed inverted
    ctx.globalCompositeOperation='difference';
    ctx.fillStyle='white';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Revert Brush back to Previous State
    ctx.globalCompositeOperation = currentCompositeOperation;
}

function grayscale() {

}

let dotted = 0;
let customStored;

function testCustom() {

    /* Dynamic LineCap
    console.log("dotted: ", dotted, " lineJoin: ", ctx.lineCap);

    if (dotted <= 150) {
        ctx.lineCap = 'round';
    }

    else if (dotted <= 300) {
        ctx.lineCap = 'butt';
    }

    else if (dotted <= 450) {
        ctx.lineCap = 'square';
    }

    else {
        dotted = 0;
    }

    dotted++;
    */
 
    /* Skip in between
    if (ctx.strokeStyle !== '#ffffff')
        customStored = ctx.strokeStyle;

    if (dotted % 2 != 0) {
        ctx.strokeStyle = "white";
    } else {
        ctx.strokeStyle = customStored;
    }

    dotted++;
    */
}

/* When we pick a normal color normally, we remove any custom color effects for better functionality of the program */
function removeCustomColorEffects() {
    // ATM we only have rainbowButton effect
    const index = customEffects.indexOf(rainbowButton.dataset.effect);

    if (index > -1) {
        customEffects.splice(index, 1);
        colorDisplay.style.transition = "0.5s";
        rainbowButton.classList.remove("active-custom");    
    }
}

/* ============================== Canvas Methods ============================== */
/* Loads the Canvas from the content of the the 'dataURL' */
function loadCanvas(dataURL) {
    var img = new Image;
    img.src = dataURL;
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    };
}

/* Saves the Canvas to localStorage so that we do not lose progress if we were to accidentally close the browser/tab. This function
   is called after we draw anything on the canvas. */
function saveCanvas() {
    isDrawing = false;
    clearButton.classList.remove('disabled');
    localStorage.setItem(canvasName, canvas.toDataURL());
}

/* Stores the previousCanvas to equal the current Canvas dataURL before we draw again */
function savePreviousCanvas() {
    previousCanvas = canvas.toDataURL();

    // Max previous states we are storing reached -- must starting shifting elements to the left -- eleminating the oldest stored canvas from memory
    if (State.index == State.max - 1) {
        State.states.push(previousCanvas);
        State.states.splice(-State.max - 1, State.states.length - State.max);
    }
    // Our Index is not at the end of the array meaning the User hit Undo AND the user then proceeded to draw, which eliminates the stored canvas to the right side (newest ones prior to undo)
    else if (State.index < State.states.length - 1) {
        State.states[State.index++] = previousCanvas;
        State.states.splice(State.index + 1, State.states.length);
    // First few drawn brushes for the Session
    } else {
        State.states[++State.index] = previousCanvas;
    }

    // If State.index becomes greater than 0, that means we have states we can refer back to so we enable the undoButton
    if (State.index > 0)
        undoButton.classList.remove("disabled");
}

function save() {
    var img    = canvas.toDataURL("image/png");
    document.write('<img src="'+img+'"/>');
}

function clear() {
    if (!clearButton.classList.contains('disabled')) {
        savePreviousCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveCanvas();
        
        clearButton.classList.add("disabled");
    }
}

/* Undo functionality by clearing the Canvas and calling loadCanvas on the State previous to the current one. Disables undoButton if there are no previous States to go back to, and Enables clearButton if there are is a previousCanvas. */
function undo(event) {
    if (State.index <= 0) {
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    loadCanvas(State.states[State.index--]);

    if (State.index == 0) {
        undoButton.classList.add("disabled");
    }
    
    // If there is a previousCanvas we can revert to, then we remove the 'disabled' functionality from the clearButton
    if (previousCanvas) {
        clearButton.classList.remove('disabled');
    }
}

/* Redo functionality by loading the Canvas forward as long as we are not at the most current state. */
function redo(event) {
    if (State.index == State.states.length - 1) {
        return; // console.log("Can not redo anything");
    } else {
        loadCanvas(State.states[++State.index]); //         console.log("WE have states to go to!"); console.log("State.index: " + State.index);
    }
}

/* Changes the ColorDisplay which shows the current color of the User */
function changeColor(color, colorButton = null) {
    // Removes the Class current-color from the currentColor we have
    if (currentColor != null)
        currentColor.classList.remove('current-color');

    ctx.strokeStyle = color;
    
    // currentColor only stores the current color button if it is not null. (e.g Is nnull when we use the Color Picker Tool)
    if (colorButton) {
        currentColor = colorButton;
        // Adds the current-color class to the chosen color to indicate that it's currently in use
        colorButton.classList.add('current-color');
    }

    // Changes the Color Display on the Top to match the chosen color
    colorDisplay.style.background = ctx.strokeStyle;

    // Store the Last Used Color
    localStorage.setItem(lastUsedColor, ctx.strokeStyle);

    // Removes any Custom Color Effects since we are changing the color
    removeCustomColorEffects();
}



/* ============================== Initialization Functions ============================== */
/* */
function initCanvas() {
    // Default Settings
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // Removes the transparency of the Canvas and adds a White background
    ctx.fillStyle='white';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Default Brush Settings
    ctx.lineJoin    = 'round';
    ctx.lineCap     =  'round';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = localStorage.getItem(lastUsedColor) || 'black';
    colorDisplay.style.background = ctx.strokeStyle;

    // Canvas Event Listeners
    canvas.addEventListener('mousemove', draw);

    canvas.addEventListener('mousedown', (event) => {
        var c = event.offsetX;
        var r = event.offsetY;

        if (currentTool.dataset.tool === 'paint') {
            isDrawing = true;
            [lastX, lastY] = [c, r];
    
            // Store the Previous Canvas -- Allows Undo Functionality 
            savePreviousCanvas();
            localStorage.setItem(previousName, previousCanvas);
        }
        else if (currentTool.dataset.tool === 'fill') {
            fill(c, r);
        }
        else if (currentTool.dataset.tool === 'pick') {
            pick(c, r);
        }
        else {
            drawShape(event.pageX, event.pageY, c, r);
        }
    });
    
    // This handles the case where the User simply clicks to add small dots
    canvas.addEventListener('click', (event) => {
        if (currentTool != paintBrushButton)
            return;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(event.offsetX, event.offsetY);
        ctx.stroke();
    });

    // When the mouse is released up, we want to stop drawing and save the canvas to localStorage
    canvas.addEventListener('mouseup', saveCanvas);
    
    // Handles if the mouse leaves the canvas/window, then we disable drawing and save the canvas to localStorage
    canvas.addEventListener('mouseout', saveCanvas);
}

/* Initializes the color buttons so that they are able to be clicked to change the color of the User */
function initColors() {
    // Initialize Default Colors
    colors.forEach(color => {
        color.style.background = color.dataset.color;
        
        // Allows User to click to change color of the Brush
        color.addEventListener('click', (event) => changeColor(color.dataset.color, color));
    });

    // Initialize Custom RGB Picker Colors (User has 2)
    customRGBSliders.forEach(rgbSlider => {
        // Clicking on the RGBSlider will change the current brush color to match it (Essentially storing a custom color)
        rgbSlider.addEventListener('click',  (event) => changeColor(rgbSlider.value, rgbSlider));

        // Changing the RGBSlider will change the current brush color to match the change
        rgbSlider.addEventListener('change', (event) => changeColor(rgbSlider.value, rgbSlider));
    });
}

/* Initializes the Slider Listener functionality for the Checkboxes in the Tool Container */
function initSliders() {
    // Width Event Listener
    widthSlider.addEventListener('change', () => ctx.lineWidth = widthSlider.value);

    // Transparency Event Listener
    transparencySlider.addEventListener('change', () => ctx.globalAlpha = transparencySlider.value / 10);
}

/* Initializes the Event Listener functionality for the Checkboxes in the Tool Container */
function initCheckBoxes() {
    // Checkboxes for LineCap
    lineCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Iterate through each checkbox and uncheck any that are not the changed checkbox
            lineCheckboxes.forEach(cb => {
                if (cb !== checkbox) {
                    cb.querySelector("input").checked = false;
                } else {
                    cb.querySelector("input").checked = true;
                    ctx.lineCap = cb.dataset.linecap;
                }
            });
        });
    });
}



const background = document.querySelector('.dropdown-background');

/* Initializes the Event Listeners functionality for the buttons in the Tool Container */
function initButtons() {
    // Save Button to save the drawn image
    saveButton.addEventListener('click', save);
    
    // ClearButton to clear Canvas
    clearButton.addEventListener('click', clear);

    // Undobutton to undo the last thing drawn on the Canvas
    undoButton.addEventListener('click', undo); 
    redoButton.addEventListener('click', redo);

    // Hides the ToolContainer
    hideButton.addEventListener("click", () => toolContainer.classList.add("inactive"));

    // User Tools -- Paint Brush, Fill-Bucket, ColorPicker, and Shape Picker 
    paintBrushButton.addEventListener("click", () => toolTransition(paintBrushButton));
    paintBrushButton.addEventListener("mouseenter", () => handleDropdownEnter(paintBrushButton));
    paintBrushButton.addEventListener("mouseleave", () => handleDropdownLeave(paintBrushButton));

    fillBucketButton.addEventListener("click", () => toolTransition(fillBucketButton));

    colorPickerButton.addEventListener("click", () => toolTransition(colorPickerButton));

    shapePickerButton.addEventListener("click", () => toolTransition(shapePickerButton));
    shapePickerButton.addEventListener("mouseenter", () => handleDropdownEnter(shapePickerButton));
    shapePickerButton.addEventListener("mouseleave", () => handleDropdownLeave(shapePickerButton));

    // Shape Button Event Listeners
    fRectangleButton.addEventListener("click", () => shapePickerButton.dataset.tool = fRectangleButton.dataset.tool);
    sRectangleButton.addEventListener("click", () => shapePickerButton.dataset.tool = sRectangleButton.dataset.tool);
}

function handleDropdownEnter(button) {
    button.classList.add('trigger-enter');
    // Arrow Function -- value of this is inherited from parent
    setTimeout(() => button.classList.contains('trigger-enter') &&
    button.classList.add('trigger-enter-active'), 150);
    background.classList.add('open');

    // Acquire the dropdown for the current tool
    const dropdown = button.querySelector(".dropdown");
    const dropdownCoords = dropdown.getBoundingClientRect();
    
    var leftHARD = 30;
    var offsetHARD = 30;

    // Adjusts the dropdown background to move to the current tool dropdown
    background.style.setProperty('width', `${dropdownCoords.width}px`);
    background.style.setProperty('height', `${dropdownCoords.height}px`);
    background.style.setProperty('transform', `translate(${dropdownCoords.left - leftHARD}px, ${dropdownCoords.top - offsetHARD}px)`);
}

function handleDropdownLeave(button) {
    // Hide dropdown and background
    button.classList.remove('trigger-enter', 'trigger-enter-active');
    background.classList.remove('open');

    const dropdown = button.querySelector(".dropdown");
    const dropdownCoords = dropdown.getBoundingClientRect();

    // Removes the background from the scene and prevents it from getting in the way of the Canvas
    background.style.setProperty('width', '0px');
    background.style.setProperty('height', '0px');
    background.style.setProperty('transform', `translate(${-dropdownCoords.left}px, ${-dropdownCoords.top}px)`);
}





/* Handles the transition between new Tools clicked by the User */
function toolTransition(newTool) {
    // Removes the previous tool as being shown as the current tool in use
    currentTool.classList.remove("current-tool");
    currentTool = newTool;
    
    // Displays the newTool as the Current Tool in Use
    currentTool.classList.add("current-tool");

    // Remove Click Points from previous tools
    if (!clickPoint.classList.contains('hidden')) {
        clickPoint.classList.add('hidden');
    }

    // Handles Closing the HorizontalDisplay for the Shapes Menu when we click on other tools
    if (newTool != shapePickerButton) {
        //horizontalDisplay.classList.add("hidden");
    } else {
        //horizontalDisplay.classList.toggle("hidden"); 
    }

    // Reasign the Last coordinates to 0 in case we drew previously
    [lastX, lastY] = [0, 0];
}

/* Initializes the Dropdown on the Tool Container */
function initDropdowns() {
    /* Brush Effects Dropdown */
    effectsDropdownButton.addEventListener('click', (event) => {
        document.getElementById("effects-dropdown").classList.toggle("show");
    });

    effectsOptions.forEach(effect => {
        effect.addEventListener('click', () => ctx.globalCompositeOperation = effect.dataset.effect);
    });

    // Closes the dropdown if any event outside of it occurs
    window.onclick = function(event) {
        if (!event.target.matches('.dropbtn')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");

            for (var i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    }
}


/* Initializes the Custom Effects Buttons. */
function initCustoms() {
    // Event Listener for the Custom Rainbow StrokeStyle
    rainbowButton.addEventListener("click", () => {
        const index = customEffects.indexOf(rainbowButton.dataset.effect);

        if (index > -1) {
            customEffects.splice(index, 1);
            colorDisplay.style.transition = "0.5s";
            rainbowButton.classList.remove("active-custom");
        }
        else {
            customEffects.push("rainbow");
            colorDisplay.style.transition = "0s";
            rainbowButton.classList.add("active-custom");
        }
    });

    // Event Listener for the Dynamic Width when drawing
    directionalButton.addEventListener("click", () => {
        const index = customEffects.indexOf(directionalButton.dataset.effect);

        if (index > -1) {
            customEffects.splice(index, 1);
            ctx.lineWidth = widthSlider.value;
            directionalButton.classList.remove("active-custom");
        }
        else {
            customEffects.push("directional");
            directionalButton.classList.add("active-custom");
        }
    });

    // Event Listener for Inverting the Canvas
    invertButton.addEventListener("click", invert);

    const custButton = document.querySelector("#cust");
    custButton.addEventListener("click", () => {
        customEffects.push("cust");
    });
}

/* Program Init() Method that sets up and begins the program */
function init() {
    // Initialize the default settings and event listeners for the Canvas
    initCanvas();

    // Initialize Colors
    initColors();

    // Initializes the Sliders
    initSliders();

    // Initializes the Checkboxes
    initCheckBoxes();

    // Initialize the Buttons event listeners
    initButtons();

    // Initialize the Dropdowns
    initDropdowns();

    // Initializes the Event Listeners for the Custom Effects
    initCustoms();

    // Loads the Canvas from Local Storage
    loadCanvas(localStorage.getItem(canvasName));
}

