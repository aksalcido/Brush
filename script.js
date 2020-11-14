const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const colors = document.querySelectorAll(".paint");

// Input Sliders
const toolSliders = document.querySelectorAll(".tool-slider");
const widthSlider = document.querySelector("#line-width");
const transparencySlider = document.querySelector("#transparency");
const customRGBSliders = document.querySelectorAll(".custom-rgb");

// Check boxes
const lineCheckboxes = document.querySelectorAll(".checkbox-container");

// Buttons 
const saveButton = document.querySelector('#save');
const clearButton = document.querySelector('#clear');

// GLOBAL Drawing Variables
let lastX     = 0;
let lastY     = 0;
let isDrawing = false;

const canvasName = "brushCanvas";
const previousName = "previousCanvas";

var previousCanvas = localStorage.getItem(previousName) || null;

// Initialize the Program
init();

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

function undo(event) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    loadCanvas(previousCanvas);

    // If there is a previousCanvas we can revert to, then we remove the 'disabled' functionality from the clearButton
    if (previousCanvas) {
        clearButton.classList.remove('disabled');
    }

    //localStorage.setItem(canvasName, previousCanvas.toDataURL());
}

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

function initColors() {
    // Initialize Default Colors
    colors.forEach(color => {
        color.style.background = color.dataset.color;
        
        // Allows User to click to change color of the Brush
        color.addEventListener('click', function(event) {
            ctx.strokeStyle = this.dataset.color;
        });
    });

    // Initialize Custom RGB Picker Colors (User has 2)
    customRGBSliders.forEach(rgbSlider => {
        // Clicking on the RGBSlider will change the current brush color to match it (Essentially storing a custom color)
        rgbSlider.addEventListener('click',  () => ctx.strokeStyle = rgbSlider.value);
        // Changing the RGBSlider will change the current brush color to match the change
        rgbSlider.addEventListener('change', () => ctx.strokeStyle = rgbSlider.value);
    });
}

function init() {
    // Initialize Colors
    initColors();

    // Default Settings
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.strokeStyle = '#BADA55';
    ctx.lineJoin    = 'round';
    ctx.lineCap     =  'round';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1.0;

    // Canvas Event Listeners
    canvas.addEventListener('mousemove', draw);

    canvas.addEventListener('mousedown', (event) => {
        isDrawing = true;
        [lastX, lastY] = [event.offsetX, event.offsetY];

        // Store the Previous Canvas -- Allows Undo Functionality 
        savePreviousCanvas();
        localStorage.setItem(previousName, previousCanvas);
    });
    
    // When the mouse is released up, we want to stop drawing and save the canvas to localStorage
    canvas.addEventListener('mouseup', saveCanvas);
    
    // Handles if the mouse leaves the canvas/window, then we disable drawing and save the canvas to localStorage
    canvas.addEventListener('mouseout', saveCanvas);

    // Width Event Listener
    widthSlider.addEventListener('change', () => ctx.lineWidth = widthSlider.value);

    // Transparency Event Listener
    transparencySlider.addEventListener('change', () => ctx.globalAlpha = transparencySlider.value / 10);

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
    undoButton = document.querySelector("#undo");
    undoButton.addEventListener('click', undo); 

    // Loads the Canvas from Local Storage
    loadCanvas(localStorage.getItem(canvasName));
}