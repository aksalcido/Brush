const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const colors = document.querySelectorAll(".paint");

// Input Sliders
const toolSliders = document.querySelectorAll(".tool-slider");
const widthSlider = document.querySelector("#line-width");

// Buttons 
const saveButton = document.querySelector('#save');
const clearButton = document.querySelector('#clear');

// GLOBAL Drawing Variables
let lastX     = 0;
let lastY     = 0;
let isDrawing = false;

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

function initColors() {
    // Initialize Colors
    colors.forEach(color => {
        color.style.background = color.dataset.color;
        
        // Allows User to click to change color of the Brush
        color.addEventListener('click', function(event) {
            ctx.strokeStyle = this.dataset.color;
        });
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
    ctx.lineCap     = 'round';
    ctx.lineWidth = 2;

    // Canvas Event Listeners
    canvas.addEventListener('mousemove', draw);

    canvas.addEventListener('mousedown', (event) => {
        isDrawing = true;
        [lastX, lastY] = [event.offsetX, event.offsetY];
    });
    
    // When the mouse is released up, we want to stop drawing
    canvas.addEventListener('mouseup', () => isDrawing = false);
    
    // Handles if the mouse leaves the canvas/window, then we disable drawing
    canvas.addEventListener('mouseout', () => isDrawing = false);

    // Width Event Listener
    widthSlider.addEventListener('change', () => ctx.lineWidth = widthSlider.value);

    // ADDITIONAL BELOW //
}

const customRGBSliders = document.querySelectorAll(".custom-rgb");

console.log(customRGBSliders);

customRGBSliders.forEach(rgbSlider => {
    // Clicking on the RGBSlider will change the current brush color to match it (Essentially storing a custom color)
    rgbSlider.addEventListener('click',  () => ctx.strokeStyle = rgbSlider.value);
    // Changing the RGBSlider will change the current brush color to match the change
    rgbSlider.addEventListener('change', () => ctx.strokeStyle = rgbSlider.value);
});

saveButton.addEventListener('click', () => {
    var img    = canvas.toDataURL("image/png");
    document.write('<img src="'+img+'"/>');

    /* Use below to allow to save the canvas to local storage
    If you want to save just a bitmap then you can save it this way:

    localStorage.setItem(canvasName, canvas.toDataURL());
    and then load like this:

    var dataURL = localStorage.getItem(canvasName);
    var img = new Image;
    img.src = dataURL;
    img.onload = function () {
    ctx.drawImage(img, 0, 0);
    };
    I recommend to use canvas.toDataURL() instead of ctx.getImageData() because ctx.getImageData() JSON string size
     will be just enormous even if canvas is empty.
    */
});

clearButton.addEventListener('click', () => ctx.clearRect(0, 0, canvas.width, canvas.height));

