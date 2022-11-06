const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');

class Box {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    isInBox(x, y) {
        return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
    }
}
class Color {
    constructor(h, s, l) {
        this.h = h;
        this.s = s;
        this.l = l;
    }
    toString() {
        return `hsl(${this.h}, ${this.s}%, ${this.l}%)`;
    }
    static fromHex(hex) {
        const rgb = Color.hexToRgb(hex);
        const hsl = Color.rgbToHsl(rgb.r, rgb.g, rgb.b);
        return new Color(hsl.h, hsl.s, hsl.l);
    }
    static hexToRgb(hex) {
        const bigint = parseInt(hex, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }
    static rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max == min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return {
            h: h * 360,
            s: s * 100,
            l: l * 100
        };
    }

}

const pallete = {
    "cool_winter": [
        Color.fromHex("F4ED83"),
        Color.fromHex("2C816A"),
        Color.fromHex("2F509F"),
        Color.fromHex("8D4366"),
        Color.fromHex("AB55A0"),
        Color.fromHex("4E3B7B"),
        Color.fromHex("333B5F"),
        Color.fromHex("2B2C2E"),
    ],
    "clear_winter": [
        Color.fromHex("F4F170"),
        Color.fromHex("2B8F4F"),
        Color.fromHex("3B8CCB"),
        Color.fromHex("84343D"),
        Color.fromHex("AB55A0"),
        Color.fromHex("825CA5"),
        Color.fromHex("374284"),
        Color.fromHex("28292B"),
    ],
    "deep_winter": [
        Color.fromHex("D2DE3C"),
        Color.fromHex("347847"),
        Color.fromHex("25A3B9"),
        Color.fromHex("9C373D"),
        Color.fromHex("C03A52"),
        Color.fromHex("764B9B"),
        Color.fromHex("373F7E"),
        Color.fromHex("2B2C2E"),
    ],
    "spring": [
        Color.fromHex("F3A8BC"),
        Color.fromHex("F5AD94"),
        Color.fromHex("FFF1AB"),
        Color.fromHex("B4F9A5"),
        Color.fromHex("9EE7F5"),
    ],
    "autumn": [
        Color.fromHex("603C14"),
        Color.fromHex("9C2706"),
        Color.fromHex("D45B12"),
        Color.fromHex("F3BC2E"),
        Color.fromHex("5F5426"),
    ],
    "summer": [
        Color.fromHex("236E96"),
        Color.fromHex("15B2D3"),
        Color.fromHex("FFD700"),
        Color.fromHex("F3872F"),
        Color.fromHex("FF598F"),
    ],
}

function closestPallete(color) {
    let min = Infinity;
    let closest = null;
    for (const name in pallete) {
        const colors = pallete[name];
        for (const c of colors) {
            const distance = (c.h - color.h) ** 2 + (c.s - color.s) ** 2 + (c.l - color.l) ** 2;
            if (distance < min) {
                min = distance;
                closest = name;
            }
        }
    }
    return closest;
}

class State {
    constructor() {
        this.color = new Color(180, 50, 50);
        this.closest = closestPallete(this.color);
        this.showVoronoi = true;
    }
    huePicked(h) {
        this.color.h = h;
        this.closest = closestPallete(this.color);
    }
    slPicked(s, l) {
        this.color.s = s;
        this.color.l = l;
        this.closest = closestPallete(this.color);
    }
    toggleVoronoi(value) {
        this.showVoronoi = value;
    }
}

let state = new State();


class SquarePicker {
    constructor(bounds) {
        this.bounds = bounds;
        this.moving = false;
        this.ballX = (state.color.s / 100);
        this.ballY = (1 - (state.color.l / 100));
    }
    draw(ctx) {
        // gradient
        const hue = state.color.h;
        const bottomLeftColor = new Color(hue, 0, 0);
        const bottomRightColor = new Color(hue, 100, 0);
        const topLeftColor = new Color(hue, 0, 100);
        const topRightColor = new Color(hue, 100, 100);
        for (let y = this.bounds.y; y < this.bounds.y + this.bounds.height; y++) {
            const percent = 1 - ((y - this.bounds.y) / this.bounds.height);
            const leftColor = this.interpolate(bottomLeftColor, topLeftColor, percent);
            const rightColor = this.interpolate(bottomRightColor, topRightColor, percent);

            const gradient = ctx.createLinearGradient(this.bounds.x, y, this.bounds.x + this.bounds.width, y);
            gradient.addColorStop(0, leftColor.toString());
            gradient.addColorStop(1, rightColor.toString());
            ctx.fillStyle = gradient;
            ctx.fillRect(this.bounds.x, y, this.bounds.width, 1);
        }

        // ball
        const ballSize = 10;
        const ballX = this.bounds.x + this.ballX * this.bounds.width;
        const ballY = this.bounds.y + (1 - this.ballY) * this.bounds.height;

        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.arc(ballX, ballY, ballSize, 0, 2 * Math.PI);
        ctx.stroke();

        // border
        ctx.beginPath();
        ctx.rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
        ctx.stroke();
    }
    interpolate(color1, color2, percent) {
        return new Color(
            color1.h + (color2.h - color1.h) * percent,
            color1.s + (color2.s - color1.s) * percent,
            color1.l + (color2.l - color1.l) * percent
        );
    }

    mouseMove(e) {
        if (this.moving) {
            this.updateValue(e);
        }
    }
    mouseDown(e) {
        this.moving = true;
        this.updateValue(e);
    }
    mouseUp(e) {
        this.moving = false;
    }
    updateValue(e) {
        this.ballY = (this.bounds.height + this.bounds.y - e.offsetY) / this.bounds.height;
        this.ballX = (e.offsetX - this.bounds.x) / this.bounds.width;
        this.ballX = Math.max(0, Math.min(1, this.ballX));
        this.ballY = Math.max(0, Math.min(1, this.ballY));

        const s = Math.round(this.ballX * 100);
        const l = Math.round(this.ballY * 100);
        state.slPicked(s, l);
    }
}

class Voronoi {
    constructor(bounds) {
        this.bounds = bounds;
        this.drawnAtHue = -1;
        this.palette = {
            "cool_winter": 1,
            "autumn": 2,
            "spring": 3,
            "summer": 4,
            "clear_winter": 5,
            "1autumn": 6,
            "1spring": 7,
            "1summer": 8,
            "deep_winter": 9,
            "2autumn": 10,
            "2spring": 11,
            "2summer": 12,
        }

        this.tempCanvas = document.createElement("canvas");
        this.tempCanvas.width = this.bounds.width;
        this.tempCanvas.height = this.bounds.height;
        this.tempCanvasContext = this.tempCanvas.getContext("2d");
        this.imageDataCache = {};
    }
    draw(ctx) {
        if (this.drawnAtHue !== state.color.h) {
            this.drawnAtHue = state.color.h;
            this.drawVoronoi();
        }
        ctx.drawImage(this.tempCanvas, this.bounds.x, this.bounds.y);
    }
    drawVoronoi() {
        const imageData = this.getImageData(state.color.h);
        this.tempCanvasContext.putImageData(imageData, 0, 0);
    }
    getImageData(hue) {
        if (!this.imageDataCache[hue]) {
            this.imageDataCache[hue] = this.calculateImageDataForHue(hue);
        }
        return this.imageDataCache[hue];
    }
    calculateImageDataForHue(hue) {
        const regions = this.makeRegions(hue);
        return this.calculateImageDataFromRegions(regions);
    }
    makeRegions(hue) {
        const regions = new Array(this.bounds.width * this.bounds.height);
        for (let x = 0; x < this.bounds.width; x++) {
            for (let y = 0; y < this.bounds.height; y++) {
                const s = Math.round(x / this.bounds.width * 100);
                const l = Math.round((1 - y / this.bounds.height) * 100);
                const color = this.getRegion(hue, s, l);
                const index = (x + y * this.bounds.width);
                regions[index] = color;
            }
        }
        return regions;
    }
    calculateImageDataFromRegions(regions) {
        const imageData = this.tempCanvasContext.createImageData(this.bounds.width, this.bounds.height);

        for (let x = 0; x < this.bounds.width; x++) {
            for (let y = 0; y < this.bounds.height; y++) {
                const current = regions[x + y * this.bounds.width];
                if (x > 0 && regions[x - 1 + y * this.bounds.width] !== current) {
                    this.drawBorder(imageData, x, y);
                    continue;
                }
                if (y > 0 && regions[x + (y - 1) * this.bounds.width] !== current) {
                    this.drawBorder(imageData, x, y);
                    continue;
                }
                if (x < this.bounds.width - 1 && regions[x + 1 + y * this.bounds.width] !== current) {
                    this.drawBorder(imageData, x, y);
                    continue;
                }
                if (y < this.bounds.height - 1 && regions[x + (y + 1) * this.bounds.width] !== current) {
                    this.drawBorder(imageData, x, y);
                    continue;
                }
            }
        }
        return imageData;
    }
    drawBorder(imageData, x, y) {
        const index = (x + y * this.bounds.width) * 4;
        imageData.data[index] = 0;
        imageData.data[index + 1] = 0;
        imageData.data[index + 2] = 0;
        imageData.data[index + 3] = 255;
    }
    getRegion(h, s, l) {
        const color = new Color(h, s, l);
        const closest = closestPallete(color);
        return this.palette[closest];
    }
}

class Toggle {
    constructor(bounds, text, value, emitFn) {
        this.bounds = bounds;
        this.text = text;
        this.value = value;
        this.emitFn = emitFn;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
        ctx.stroke();
        ctx.textBaseline = "top";
        ctx.font = "20px Arial";
        ctx.fillText(this.text, this.bounds.x + 10, this.bounds.y);
        ctx.fillText(this.value, this.bounds.x + 10, this.bounds.y + 25);
    }
    mouseDown(e) {
        this.value = !this.value;
        this.emitFn(this.value);
    }
}

class Slider {
    constructor(bounds) {
        this.bounds = bounds;
        this.value = state.color.h / 359;
        this.moving = false;
    }
    draw(ctx) {
        // gradient
        const gradient = ctx.createLinearGradient(
            this.bounds.x,
            this.bounds.y + this.bounds.height,
            this.bounds.x,
            this.bounds.y,
        );
        for (let h = 0; h <= 359; h = h + 1) {
            const color = new Color(h, 100, 50);
            gradient.addColorStop(h / 359, color.toString());
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
        // border
        ctx.beginPath();
        ctx.rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
        ctx.stroke();

        // picker
        const sliderY = Math.round((1 - this.value) * this.bounds.height);
        ctx.lineWidth = 2;
        ctx.moveTo(this.bounds.x, this.bounds.y + sliderY);
        ctx.lineTo(this.bounds.x + this.bounds.width, this.bounds.y + sliderY);
        ctx.stroke();
    }
    mouseMove(e) {
        if (this.moving) {
            this.updateValue(e);
        }
    }
    mouseDown(e) {
        this.moving = true;
        this.updateValue(e);
    }
    mouseUp(e) {
        this.moving = false;
    }
    updateValue(e) {
        this.value = (this.bounds.height + this.bounds.y - e.offsetY) / this.bounds.height;
        this.value = Math.max(0, Math.min(1, this.value));
        const h = Math.round(this.value * 359);
        state.huePicked(h);
    }
}

class Description {
    constructor(bounds) {
        this.bounds = bounds;
        this.voronoiSwitcher = new Toggle(
            new Box(this.bounds.x + 10, this.bounds.y + 50, 100, 60),
            "Voronoi",
            state.showVoronoi,
            (value) => state.toggleVoronoi(value),
        );
    }
    draw(ctx) {
        ctx.font = '20px Arial';
        ctx.fillStyle = 'black';
        ctx.textBaseline = 'top';
        ctx.fillText(state.color.toString(), this.bounds.x, this.bounds.y);
        ctx.fillText(state.closest, this.bounds.x, this.bounds.y + 25);

        this.voronoiSwitcher.draw(ctx);
    }
    mouseDown(e) {
        if (this.voronoiSwitcher.bounds.isInBox(e.offsetX, e.offsetY)) {
            this.voronoiSwitcher.mouseDown(e);
        }
    }
}

class Picker {
    constructor(bounds) {
        this.bounds = bounds;
        this.square = new SquarePicker(new Box(bounds.x + 10, bounds.y + 10, 580, 580));
        this.voronoi = new Voronoi(new Box(bounds.x + 10, bounds.y + 10, 580, 580));
        this.slider = new Slider(new Box(bounds.x + 600, bounds.y + 10, 50, 580));
        this.description = new Description(new Box(bounds.x + 660, bounds.y + 10, 300, 200));
    }
    draw(ctx) {
        this.square.draw(ctx);
        if (state.showVoronoi) {
            this.voronoi.draw(ctx);
        }
        this.slider.draw(ctx);
        this.description.draw(ctx);
    }
    mouseMove(e) {
        this.square.mouseMove(e);
        this.slider.mouseMove(e);
    }
    mouseDown(e) {
        if (this.square.bounds.isInBox(e.offsetX, e.offsetY)) {
            this.square.mouseDown(e);
        }
        if (this.slider.bounds.isInBox(e.offsetX, e.offsetY)) {
            this.slider.mouseDown(e);
        }
        if (this.description.bounds.isInBox(e.offsetX, e.offsetY)) {
            this.description.mouseDown(e);
        }
    }
    mouseUp(e) {
        this.square.mouseUp(e);
        this.slider.mouseUp(e);
    }
}


const picker = new Picker(new Box(0, 0, 1000, 600));

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    picker.draw(ctx);
}

canvas.addEventListener('mousemove', (e) => {
    picker.mouseMove(e);
    redraw();
});
canvas.addEventListener('mousedown', (e) => {
    picker.mouseDown(e);
    redraw();
});
canvas.addEventListener('mouseup', (e) => {
    picker.mouseUp(e);
    redraw();
});
canvas.addEventListener('drag', (e) => {
    return false;
});
picker.draw(ctx);

