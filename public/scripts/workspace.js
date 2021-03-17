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

// Tools
const paintBrushButton  = document.querySelector("#paint-brush");
const fillButton        = document.querySelector("#fill-bucket");
const eraserButton      = document.querySelector("#eraser");
const colorPickerButton = document.querySelector("#color-picker");
const shapePickerButton = document.querySelector("#shape-picker");

// Dropdown and Content
const brushEffectOptions = document.querySelectorAll(".dropdown-menu a");

// Custom Effects
const rainbowButton = document.querySelector("#rainbow");
const directionalButton = document.querySelector("#directional");
const invertButton = document.querySelector("#invert");
const grayscaleButton = document.querySelector("#grayscale");

// Canvas Buttons 
const saveButton  = document.querySelector('#save');
const undoButton  = document.querySelector("#undo");
const redoButton  = document.querySelector("#redo");
const clearButton = document.querySelector('#clear');
const hideButton  = document.querySelector("#hide");
const showButton  = document.querySelector("#show");

// Shape Related 
const fRectangleButton  = document.querySelector("#filledRectangle");
const sRectangleButton  = document.querySelector("#strokedRectangle");
const clickPoint = document.querySelector(".shape-click");

// Local Storage Keys Names for Access
const storageKeys = {
    canvasName: "brushCanvas",
    lastUsedColor: "lastUsedColor"
};


// Contains the default settings for the brush on load
const defaultBrushSettings = {
    lineJoin: 'round',
    lineCap: 'round',
    lineWidth: 2,
    globalAlpha: 1.0,
    strokeStyle: localStorage.getItem(storageKeys.lastUsedColor) || 'black',
};

var previousCanvas = localStorage.getItem(storageKeys.canvasName) || null;

// Represents the State of the Program and allows the User to undo/redo up to 'max' amount of turns
const State = {
    states: [previousCanvas],
    index: 1,
    max: 15
};

// GLOBAL Drawing Variables
let lastX     = 0;
let lastY     = 0;
let isDrawing = false;
let currentTool = paintBrushButton; // by default our currentTool is equal to our paint brush
let currentColor = null;
let eraseMode = false;
let activeBrushEffect = brushEffectOptions[0];

// Custom Effects Variables
let customEffects = [];
let hue = 0;
let direction = true;

// Initialize the Program
init();


/* ============================== User Tool Methods ============================== */
function draw(event) {
    if (!isDrawing) 
        return;
    
    // Custom Effects are Ran Here (if any) so long as we are not in Erasemode
    if (!eraseMode) 
        handleCustomEffects();

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();

    [lastX, lastY] = [event.offsetX, event.offsetY];
}

function fill(c, r) {
    var newColor = hexToRgb(ctx.strokeStyle);
    var pixel = ctx.getImageData(c, r, 1, 1);
    var originalColor = pixel.data;

    //fillHelper(c, r, originalColor, newColor);
    //floodFillQueue(c, r, originalColor, newColor);
    floodFillSpanFilling(c, r, originalColor, newColor);
    saveCanvas();
}


function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });
  
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    if (result)
        return new Uint8ClampedArray([parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255]);

    return null;
}

/* In Development */
function floodFillSpanFillingOptimized(x, y, originalColor, newColor) {
    if (!inside(x, y, originalColor))           //    if not Inside(x, y) then return
        return;
    
    var queue = [];                            // let s = new empty queue or stack
    queue.push([x, x, y, 1]);                  // Add (x, x, y, 1) to s
    queue.push([x, x, y - 1, -1]);             // Add (x, x, y - 1, -1) to s

    while (queue.length != 0) {
        let coord = queue[0];                  
        queue.shift();                         

        let x1 = coord[0];
        let x2 = coord[1];
        let y  = coord[2];
        let dy = coord[3];
        let x = x1;
    
        //console.log("[x1, x2, y, dy, x]");
        //console.log(x1 + " " + x2 + " " + y + " " + dy + " " + x);
        //console.log("------------------------------------");

        if (inside(x, y, originalColor)) {
            while (inside(x - 1, y, originalColor)) {
                setCoordinate(x - 1, y, newColor);
                x--;
            }
        }

        if (x < x1) {
            queue.push([x, x1 - 1, y - dy, -dy]);
        }

        while (x1 < x2) {
            while (inside(x1, y, originalColor)) {
                setCoordinate(x1, y, newColor);
                x1++;
            }

            queue.push([x, x1 - 1, y + dy, dy]);

            if ((x1 - 1) > x2) {
                queue.push([x2 + 1, x1 - 1, y - dy, -dy]);
            }

            while (x1 < x2 && !inside(x1, y, originalColor)) {
                x1++;
            }

            x = x1;
        }
    }
}

function inside(x, y, originalColor) {
    var pixel = ctx.getImageData(x, y, 1, 1);
    var data = pixel.data;

    if (data[0] !== originalColor[0] || data[1] !== originalColor[1] || data[2] !== originalColor[2] || data[3] !== originalColor[3]) {
        return false;
    }

    return true;
}


function floodFillSpanFilling(x, y, originalColor, newColor) {
    if (!inside(x, y, originalColor))
        return;
    
    var queue = [];
    queue.push([x, y]);

    while (queue.length != 0) {
        let coord = queue[0];
        queue.shift();
        let lx = coord[0];
        
        while (inside(lx - 1, coord[1], originalColor)) {
            setCoordinate(lx - 1, coord[1], newColor);
            lx -= 1;
        }

        while (inside(coord[0], coord[1], originalColor)) {
            setCoordinate(coord[0], coord[1], newColor);
            coord[0] += 1;
        }

        scan(lx, coord[0] - 1, coord[1] + 1, queue, originalColor);
        scan(lx, coord[0] - 1, coord[1] - 1, queue, originalColor);
    }
}

function scan(lx, rx, y, queue, originalColor) {
    let added = false;
    
    for (var x = lx; x < rx; x++) {
        if (!inside(x, y, originalColor))
            added = false;
        else if (!added) {
            queue.push([x, y]);
            added = true;
        }
    }
}

function setCoordinate(x, y, newColor) {
    var pixel = ctx.getImageData(x, y, 1, 1);
    var data = pixel.data;

    pixel.data[0] = newColor[0];
    pixel.data[1] = newColor[1];
    pixel.data[2] = newColor[2];
    pixel.data[3] = newColor[3]; 

    ctx.putImageData(pixel, x, y);
}

/* Non Recursive floodFill -- Too Slow */
function floodFillQueue(c, r, originalColor, newColor) {
    var queue = [];
    queue.push([c, r]);

    // While Queue is not empty
    while (queue.length != 0) {
        let coord = queue[0];
        queue.shift();

        if (coord[0] <= 0 || coord[1] <= 0)
            continue;

        var pixel = ctx.getImageData(coord[0], coord[1], 1, 1);
        var data = pixel.data;
    
        if (data[0] !== originalColor[0] || data[1] !== originalColor[1] || data[2] !== originalColor[2] || data[3] !== originalColor[3])
            continue;
        
        pixel.data[0] = newColor[0];
        pixel.data[1] = newColor[1];
        pixel.data[2] = newColor[2];
        pixel.data[3] = newColor[3]; 

        ctx.putImageData(pixel, coord[0], coord[1]);

        // (x - 1, y)
        var pixel = ctx.getImageData(coord[0] - 1, coord[1], 1, 1);
        var data = pixel.data;
    
        if (data[0] === originalColor[0] || data[1] === originalColor[1] || data[2] === originalColor[2] || data[3] === originalColor[3]) {
            ctx.putImageData(pixel, coord[0] - 1, coord[1]);
            queue.push([coord[0] - 1, coord[1]]);
        }

        // (x + 1, y)
        var pixel = ctx.getImageData(coord[0] + 1, coord[1], 1, 1);
        var data = pixel.data;
    
        if (data[0] === originalColor[0] || data[1] === originalColor[1] || data[2] === originalColor[2] || data[3] === originalColor[3]) {
            ctx.putImageData(pixel, coord[0] + 1, coord[1]);
            queue.push([coord[0] + 1, coord[1]]);
        }


        // (x, y - 1)
        var pixel = ctx.getImageData(coord[0], coord[1] - 1, 1, 1);
        var data = pixel.data;
    
        if (data[0] === originalColor[0] || data[1] === originalColor[1] || data[2] === originalColor[2] || data[3] === originalColor[3]) {
            ctx.putImageData(pixel, coord[0], coord[1] - 1);
            queue.push([coord[0], coord[1] - 1]);
        }

        // (x, y + 1)
        var pixel = ctx.getImageData(coord[0], coord[1] + 1, 1, 1);
        var data = pixel.data;
    
        if (data[0] === originalColor[0] || data[1] === originalColor[1] || data[2] === originalColor[2] || data[3] === originalColor[3]) {
            ctx.putImageData(pixel, coord[0], coord[1] + 1);
            queue.push([coord[0], coord[1] + 1]);
        }

    }
}

/* Recursive Flood Fill -- Stack overflow */
function floodFillRecursive(c, r, originalColor, newColor) {
    var pixel = ctx.getImageData(c, r, 1, 1);
    var data = pixel.data;

    if (data[0] !== originalColor[0] || data[1] !== originalColor[1] || data[2] !== originalColor[2] || data[3] !== originalColor[3])
        return;

    pixel.data[0] = newColor[0];
    pixel.data[1] = newColor[1];
    pixel.data[2] = newColor[2];
    pixel.data[3] = newColor[3]; 

    ctx.putImageData(pixel, c, r);

    fillHelper(c - 1, r, originalColor, newColor);
    fillHelper(c + 1, r, originalColor, newColor);
    fillHelper(c, r - 1, originalColor, newColor);
    fillHelper(c, r + 1, originalColor, newColor);
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

        // Saves the Canvas before the Rectangle is drawn for our Undo functionality -- Allows User to revert from drawn shape
        saveCanvas();
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

    saveCanvas();
}

function grayscale() {
    var img = new Image;
    img.src = canvas.toDataURL();
    ctx.drawImage(img, 0, 0);

    let imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    let pixels = imgData.data;

    for (var i = 0; i < pixels.length; i += 4) {
        let lightness = parseInt((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
    
        pixels[i] = lightness;
        pixels[i + 1] = lightness;
        pixels[i + 2] = lightness;
    }

    ctx.putImageData(imgData, 0, 0);
    
    saveCanvas();
}


/* ============================== Removing Custom Effects Methods ============================== */
/* When we pick a normal color normally, we remove any custom color effects for better functionality of the program */
function removeCustomColorEffects() {
    // ATM we only have rainbowButton effect
    removeRainbowEffect();
}

/* Remove all Custom Effects -- Mainly for Tool Transition */
function removeCustomEffects() {
    removeRainbowEffect();
    removeDirectionalEffect();
}

// Removes the rainbow effect
function removeRainbowEffect() {
    const rainbowIndex = customEffects.indexOf(rainbowButton.dataset.effect);

    if (rainbowIndex > -1) {
        customEffects.splice(rainbowIndex, 1);
        colorDisplay.style.transition = "0.5s";
        rainbowButton.classList.remove("active-custom");    
    }
}

// Removes the Dynamic Width effect
function removeDirectionalEffect() {
    const directionalIndex = customEffects.indexOf(directionalButton.dataset.effect);

    if (directionalIndex > -1) {
        customEffects.splice(directionalIndex, 1);
        directionalButton.classList.remove("active-custom");    
    }
}


/* ============================== Initialize Canvas Functions  ============================== */
function initCanvas() {
    // Default Settings
    resize(window.innerWidth, window.innerHeight - toolContainer.offsetHeight);
    
    canvas.style.top = toolContainer.offsetHeight.toString() + "px";

    // Removes the transparency of the Canvas and adds a White background
    ctx.fillStyle='white';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Assign default settings to the brush
    assignDefaultBrushSettings();
    
    colorDisplay.style.background = ctx.strokeStyle;

    initCanvasEventListeners();    
}

function initCanvasEventListeners() {
    canvas.addEventListener('mousemove', draw);

    // Click Down Events
    canvas.addEventListener('mousedown', (event) => clickDown(event));
    
    // This handles the case where the User simply clicks to add small a single stroke
    canvas.addEventListener('click', (event) => singleClickDown(event));

    // When the Mouse is released while painting/erasing, we want to save the canvas to local storage and to State
    canvas.addEventListener('mouseup', () => {
        if (currentTool.dataset.tool === 'paint' || currentTool.dataset.tool === 'eraser') 
            saveCanvas();
    });

    // Handles if the mouse leaves the canvas/window, then we disable drawing and save the canvas to localStorage
    canvas.addEventListener('mouseout', () => {
        if (isDrawing) 
            saveCanvas();
    });

    // Window Warn on Resize
    window.addEventListener("resize", (event) => {
        alert("WARNING! Resizing the Window will alter the Image! Return back to original size to prevent loss of Progress!");
    });
}

function resize(x, y){ 
    ctx.canvas.width = x;
    ctx.canvas.height = y;
} 

function assignDefaultBrushSettings() {
    ctx.lineJoin    = defaultBrushSettings.lineJoin;
    ctx.lineCap     = defaultBrushSettings.lineCap;
    ctx.lineWidth   = defaultBrushSettings.lineWidth;
    ctx.globalAlpha = defaultBrushSettings.globalAlpha;
    ctx.strokeStyle = defaultBrushSettings.strokeStyle;
}

function clickDown(event) {
    var c = event.offsetX;
    var r = event.offsetY;

    if (currentTool.dataset.tool === 'paint' || currentTool.dataset.tool === 'eraser') {
        if (currentTool.dataset.tool === 'eraser')
            changeColor("white", null);

        isDrawing = true;
        [lastX, lastY] = [c, r];
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
}

function singleClickDown(event) {
    if (currentTool != paintBrushButton)
        return;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
}

function release() {
    if (currentTool.dataset.tool === 'paint' || currentTool.dataset.tool === 'eraser') {
        saveCanvas();
    }
}

/* Saves the Canvas to localStorage so that we do not lose progress if we were to accidentally close the browser/tab. This function
   is called after we draw anything on the canvas. */
function saveCanvas() {
    isDrawing = false;
    localStorage.setItem(storageKeys.canvasName, canvas.toDataURL());
    storeState();
}

/* Stores the current canvas as a 'previous state' that we are capable of returning to by clicking undo */
function storeState() {
    previousCanvas = canvas.toDataURL();

    // Max previous states we are storing reached -- must starting shifting elements to the left -- eleminating the oldest stored canvas from memory
    if (State.index === State.max - 1) {
        State.states.push(previousCanvas);
        State.states.splice(-State.max - 1, State.states.length - State.max);
    }
    // Our Index is not at the end of the array meaning the User hit Undo AND the user then proceeded to draw, which eliminates the stored canvas to the right side (newest ones prior to undo)
    else if (State.index < State.states.length - 1) {
        State.states[State.index++] = previousCanvas;
        State.states.splice(State.index + 1, State.states.length);
        redoButton.classList.add("disabled");
    // First few drawn brushes for the Session
    } else {
        State.states[State.index++] = previousCanvas;
    }

    // If State.index becomes greater than 0, that means we have states we can refer back to so we enable the undoButton
    if (State.index > 0) {
        undoButton.classList.remove("disabled");
        undoButton.disabled = false;
    }
}

/* Loads the Canvas from the content of the the 'dataURL' */
function loadCanvas(dataURL) {
    var img = new Image;
    img.src = dataURL;
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    };
}

/* ============================== Color Initializations ============================== */
/* =====  Initializes the color buttons so that they are able to be clicked to change the color of the User ===== */
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


/* Changes the ColorDisplay which shows the current color of the User */
function changeColor(color, colorButton = null) {
    // Removes the Class current-color from the currentColor we have
    if (currentColor != null)
        currentColor.classList.remove('current-color');
    
    ctx.strokeStyle = color;
    
    // Prevent Hud Changes if we are currently Erasing
    if (eraseMode) return;

    // currentColor only stores the current color button if it is not null. (e.g Is nnull when we use the Color Picker Tool)
    if (colorButton) {
        currentColor = colorButton;
        // Adds the current-color class to the chosen color to indicate that it's currently in use
        colorButton.classList.add('current-color');
    }

    // Changes the Color Display on the Top to match the chosen color
    colorDisplay.style.background = ctx.strokeStyle;

    // Store the Last Used Color
    localStorage.setItem(storageKeys.lastUsedColor, ctx.strokeStyle);

    // Removes any Custom Color Effects since we are changing the color
    removeCustomColorEffects();
}


/* Initializes the Slider Listener functionality for the Checkboxes in the Tool Container */
function initSliders() {
    // Width Event Listener
    widthSlider.addEventListener('change', () => {
        ctx.lineWidth = widthSlider.value;
        
        // Remove Directional Custom Effect on Width Change
        removeDirectionalEffect();
    });

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
/* ============================== Tool Initializations ============================== */
function initTools() {
    // User Tools -- Paint Brush, Fill-Bucket, ColorPicker, and Shape Picker 
    paintBrushButton.addEventListener("click", () => toolTransition(paintBrushButton));
    
    fillButton.addEventListener("click", () => toolTransition(fillButton));

    eraserButton.addEventListener("click", () => toolTransition(eraserButton));

    colorPickerButton.addEventListener("click", () => toolTransition(colorPickerButton));

    shapePickerButton.addEventListener("click", () => toolTransition(shapePickerButton));

    // Shape Button Event Listeners
    fRectangleButton.addEventListener("click", () => shapePickerButton.dataset.tool = fRectangleButton.dataset.tool);
    sRectangleButton.addEventListener("click", () => shapePickerButton.dataset.tool = sRectangleButton.dataset.tool);

}

/* Handles the transition between new Tools clicked by the User */
function toolTransition(newTool) {
    // Handles the Tool Transition for erase mode
    handleEraseModeTransition(newTool.dataset.tool);

    // Remove Custom Color Effects for better functionality
    removeCustomEffects();

    // Removes the previous tool as being shown as the current tool in use
    currentTool.classList.remove("current-tool");
    currentTool = newTool;

    // Displays the newTool as the Current Tool in Use
    currentTool.classList.add("current-tool");

    // Remove Click Points from previous tools
    if (!clickPoint.classList.contains('hidden')) {
        clickPoint.classList.add('hidden');
    }

    // Reasign the Last coordinates to 0 in case we drew previously
    [lastX, lastY] = [0, 0];
}

/* ===== Initializes the Event Listeners functionality for the buttons in the Tool Container ===== */
function initCanvasButtons() {
    // Save Button to save the drawn image
    saveButton.addEventListener('click', save);
    
    // ClearButton to clear Canvas
    clearButton.addEventListener('click', clear);

    // Undobutton to undo the last thing drawn on the Canvas
    undoButton.addEventListener('click', undo); 
    
    // Redo button to redo any undo changes made    
    redoButton.addEventListener('click', redo);

    // Hides the ToolContainer
    hideButton.addEventListener("click", hide);
}

/* Save the Canvas and Upload to backend as a fetch request */
function save() {
    var confirmation = confirm("Do you want to save this? You will not be able to edit any further?");

    if (confirmation) {
        // Save contents of the Canvas
        var img    = canvas.toDataURL("image/png");
        var data   = JSON.stringify({image: img});

        // Mark Canvas as blank for future use
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveCanvas();
        
        fetch('/create',
            { method: "POST", body: data, redirect: "follow", headers: {'Content-Type': 'application/json'}})
            .then(response => { 
                window.location.replace(response.url);
            })
            .then(function(myJson) { 
                console.log(myJson); 
            })
            .catch(error => {
                console.log(error);
        });
    }
}

/* Clear the entire Canvas */
function clear() {
    var confirmation = confirm("Are you sure you want to clear the entire Canvas?");

    if (confirmation) {
        ctx.fillStyle='white';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        saveCanvas();
    }
}

/* Undo functionality by clearing the Canvas and calling loadCanvas on the State previous to the current one. Disables undoButton if there are no previous States to go back to, and Enables clearButton if there are is a previousCanvas. */
function undo(event) {
    if (undoButton.classList.contains("disabled") || State.index <= 1) {
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    loadCanvas(State.states[--State.index - 1]);
    redoButton.classList.remove("disabled");

    if (State.index === 1) {
        undoButton.classList.add("disabled");
    }
}

/* Redo functionality by loading the Canvas forward as long as we are not at the most current state. */
function redo(event) {
    if (redoButton.classList.contains("disabled") || State.index === State.states.length) {
        return;
    } else {
        undoButton.classList.remove("disabled");
        loadCanvas(State.states[State.index++]);

        if (State.index === State.states.length) {
            redoButton.classList.add("disabled");
        }
    }
}

function hide(event) {
    toolContainer.classList.add("inactive");
    showButton.classList.remove("non-existent");
    canvas.style.top = "100px";
}

// ===================== //
function handleEraseModeTransition(tool) {
    if (eraseMode && tool !== 'eraser') {
        eraseMode = false;
        changeColor(localStorage.getItem(storageKeys.lastUsedColor));
    }

    if (!eraseMode && tool === 'eraser') {
        eraseMode = true;

        // Store the Last Used Color
        localStorage.setItem(storageKeys.lastUsedColor, ctx.strokeStyle);
    }
}

/* Initializes the Dropdown on the Tool Container */
function initDropdowns() {
    /* Brush Effects Dropdown */
    brushEffectOptions.forEach(effect => {
        effect.addEventListener('click', () => {
            activeBrushEffect.classList.remove("active-brush-effect");
            ctx.globalCompositeOperation = effect.dataset.effect
            activeBrushEffect = effect;
            activeBrushEffect.classList.add("active-brush-effect");
        });
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
        if (eraseMode) {
            toolTransition(paintBrushButton);
        }

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

    // Event Listener for Grayscaling the Canvas
    grayscaleButton.addEventListener("click", grayscale);
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

    // Initialize the Tool Buttons
    initTools();
    
    // Initialize the Canvas Buttons
    initCanvasButtons();

    // Initialize the Dropdowns
    initDropdowns();

    // Initializes the Event Listeners for the Custom Effects
    initCustoms();

    // Loads the Canvas from Local Storage
    loadCanvas(localStorage.getItem(storageKeys.canvasName));

    setTimeout(() => {
        document.querySelector(".loader-wrapper").style.display = 'none';
        document.querySelector(".loader").style.display = 'none';
        document.querySelector(".brush-wrapper").style.display = "block";
    }, 2000);
}

