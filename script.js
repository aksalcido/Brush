const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const colors = document.querySelectorAll(".paint");
const toolContainer = document.querySelector(".tools-container");

// Represents the current color the brush has equipped
const colorDisplay = document.querySelector("#current-color");

// Input Sliders
const toolSliders = document.querySelectorAll(".tool-slider");
const widthSlider = document.querySelector("#line-width");
const transparencySlider = document.querySelector("#transparency");
const customRGBSliders = document.querySelectorAll(".custom-rgb");

// Check boxes
const lineCheckboxes = document.querySelectorAll(".checkbox-container");

// Buttons 
const saveButton  = document.querySelector('#save');
const undoButton  = document.querySelector("#undo");
const clearButton = document.querySelector('#clear');
const hideButton  = document.querySelector("#hide");

// Tools
const paintBrushButton  = document.querySelector("#paint-brush");
const fillBucketButton  = document.querySelector("#fill-bucket");
const colorPickerButton = document.querySelector("#color-picker");

// Dropdown and Content
const effectsDropdownButton = document.querySelector(".dropbtn");
const effectsOptions = document.querySelectorAll("#effects-dropdown a");

// GLOBAL Drawing Variables
let lastX     = 0;
let lastY     = 0;
let isDrawing = false;
let currentTool = paintBrushButton; // by default our currentTool is equal to our paint brush

const canvasName = "brushCanvas";
const previousName = "previousCanvas";

var previousCanvas = localStorage.getItem(previousName) || null;

// Initialize the Program
init();

/* ========== User Tool Methods ========== */
function draw(event) {
    //console.log(isDrawing);
    if (!isDrawing) 
        return;

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


    ctx.putImageData(imageData, 0, 0);
    console.log("done?");


    fillPixel(data, c, r, ocolor, ctx.strokeStyle);
}

function fillPixel(data, c, r, ocolor, ncolor) {
    console.log("ocolor: " + ocolor);
    console.log("ncolor: " + ncolor);

    /*
    for(var i = 0; i < canvas.height; i += 4) {
       data[i] = 130;
        data[i + 1] = 40;
        data[i + 2] = 40;
    }
    */
}

// Pick Color based off Clicked Pixel on Canvas //
function pick(c, r) {
    var pixel = ctx.getImageData(c, r, 1, 1);
    var data = pixel.data; // represents the rgba
    var rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3]})`;
    changeColor(rgba);
}

/* ========== Custom Effects Methods ========== */








/* ========== Canvas Methods ========== */
// Loads the Canvas from the content of the the 'dataURL'
function loadCanvas(dataURL) {
    var img = new Image;
    img.src = dataURL;
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    };
}

// Saves the Canvas to localStorage so that we do not lose progress if we were to accidentally close the browser/tab. This function
// is called after we draw anything on the canvas.
function saveCanvas() {
    isDrawing = false;
    clearButton.classList.remove('disabled');
    localStorage.setItem(canvasName, canvas.toDataURL());
}

// Stores the previousCanvas to equal the current Canvas dataURL before we draw again
function savePreviousCanvas() {
    previousCanvas = canvas.toDataURL();
}

function undo(event) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    loadCanvas(previousCanvas);

    // If there is a previousCanvas we can revert to, then we remove the 'disabled' functionality from the clearButton
    if (previousCanvas) {
        clearButton.classList.remove('disabled');
    }

    //localStorage.setItem(canvasName, previousCanvas.toDataURL());
}

// Changes the ColorDisplay which shows the current color of the User
function changeColor(color) {
    ctx.strokeStyle = color;
    colorDisplay.style.background = ctx.strokeStyle;
}



/* ========== Initialization Functions ========== */
function initCanvas() {
    // Default Settings
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.strokeStyle = 'black';
    ctx.lineJoin    = 'round';
    ctx.lineCap     =  'round';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1.0;
    //ctx.globalCompositeOperation = 'xor'; // Adds stacking effect if draw on top of color

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
    });
    
    // When the mouse is released up, we want to stop drawing and save the canvas to localStorage
    canvas.addEventListener('mouseup', saveCanvas);
    
    // Handles if the mouse leaves the canvas/window, then we disable drawing and save the canvas to localStorage
    canvas.addEventListener('mouseout', saveCanvas);
}

// Initializes the color buttons so that they are able to be clicked to change the color of the User
function initColors() {
    // Initialize Default Colors
    colors.forEach(color => {
        color.style.background = color.dataset.color;
        
        // Allows User to click to change color of the Brush
        color.addEventListener('click', (event) => changeColor(color.dataset.color));
    });

    // Initialize Custom RGB Picker Colors (User has 2)
    customRGBSliders.forEach(rgbSlider => {
        // Clicking on the RGBSlider will change the current brush color to match it (Essentially storing a custom color)
        rgbSlider.addEventListener('click',  (event) => changeColor(rgbSlider.value));

        // Changing the RGBSlider will change the current brush color to match the change
        rgbSlider.addEventListener('change', (event) => changeColor(rgbSlider.value));
    });
}

function initSliders() {
    // Width Event Listener
    widthSlider.addEventListener('change', () => ctx.lineWidth = widthSlider.value);

    // Transparency Event Listener
    transparencySlider.addEventListener('change', () => ctx.globalAlpha = transparencySlider.value / 10);
}

function initCheckBoxes() {
    // Checkboxes for LineCap
    lineCheckboxes.forEach(checkboxContainer => {
        checkboxContainer.addEventListener('change', () => {
            // Iterate through each checkbox and uncheck any that are not the changed checkbox
            lineCheckboxes.forEach(cbc => {
                if (cbc !== checkboxContainer) {
                    cbc.querySelector("input").checked = false;
                } else {
                    cbc.querySelector("input").checked = true;
                    ctx.lineCap = cbc.dataset.linecap;
                }
            });
        });
    });
}

function initButtons() {
    // Save Button to save the drawn image
    saveButton.addEventListener('click', () => {
        var img    = canvas.toDataURL("image/png");
        document.write('<img src="'+img+'"/>');
    });
    
    // ClearButton to clear Canvas
    clearButton.addEventListener('click', () => {
        if (!clearButton.classList.contains('disabled')) {
            savePreviousCanvas();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveCanvas();
            clearButton.classList.add("disabled");
        }
    });

    // Undobutton to undo the last thing drawn on the Canvas
    undoButton.addEventListener('click', undo); 

    // Hides the ToolContainer
    hideButton.addEventListener("click", () => toolContainer.classList.add("inactive"));

    // User Tools -- Paint Brush, Fill-Bucket, and ColorPicker 
    paintBrushButton.addEventListener("click", () => currentTool = paintBrushButton);
    fillBucketButton.addEventListener("click", () => currentTool = fillBucketButton);
    colorPickerButton.addEventListener("click", () => currentTool = colorPickerButton);
}

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

// Program Init() Method that sets up and begins the program
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

    // Loads the Canvas from Local Storage
    loadCanvas(localStorage.getItem(canvasName));
}

