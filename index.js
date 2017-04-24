const fs = require('fs');
const {PNG} = require('pngjs');
const {JSFuck} = require('jsfuck');
const inputFile = process.argv[2];
const LINE_LENGTH = 171;
const HEIGHT = 60;
const ASCII_A = 'A'.charCodeAt(0);
const SPACING = 3;
const FONT_CHAR_HEIGHT = 11
var fontpixels;
var pixelCounts;
var fontCharOffsets;
var fontCharWidths;
fs.mkdir('output', start);

function start() {
  var data = fs.readFileSync('large_font.png');
  fontpixels = PNG.sync.read(data);
  [fontCharOffsets, fontCharWidths] = readFontMetrics(fontpixels);
  pixelCounts = makePixelCounts(fontpixels);
  var lineReader = require('readline').createInterface({
    input: fs.createReadStream(inputFile)
  });
  lineReader.on('line', convertLine);  
}

function readFontMetrics(fontPixels) {
  var offsets = [], widths = [];
  var start = 0;
  var len = 0;
  var x;
  var w = fontPixels.width;
  for(x=0;x<w;x++) {
    if (fontPixels.data[x * 4] === 0) {
      if (len > 0) {
        offsets.push(start);
        widths.push(len);
      }
      start = x;
      len = 1;
    } else {
      len++;
    }
  }
  // and the last one
  offsets.push(start);
  widths.push(len);
  return [offsets, widths];
}

function makePixelCounts(fontPixels) {
  var pc = [];
  var c;
  var l = 26;
  var y, x;
  for (c=0;c<l;c++) {
    var localCount = 0;
    for(y=1;y<FONT_CHAR_HEIGHT;y++) {
      for(x=0;x<fontCharWidths[c];x++) {
        if (fontPixels.data[y * fontPixels.width * 4 + (fontCharOffsets[c] + x) * 4] === 0) {
          localCount++;
        }        
      }
    }
    pc.push(localCount);
  }
  return pc;
}

function pixelsPerLine(line) {
  var sum = 0;
  Array.from(line).forEach((char) => {    
    var charPos = char.toUpperCase().charCodeAt(0) - ASCII_A;
    sum += pixelCounts[charPos] || 0;
  })
  return sum;
}

function textLength(line) {
  var len = 0;
  Array.from(line).forEach((char) => {    
    var charPos = char.toUpperCase().charCodeAt(0) - ASCII_A;
    len += fontCharWidths[charPos] || 0;
  })
  len += (line.length - 1) * SPACING;
  return len;
}

function charOffsets(line) {
  var offsets = [];
  var offset = 0;
  Array.from(line).forEach((char) => {    
    offsets.push(offset);
    var charPos = char.toUpperCase().charCodeAt(0) - ASCII_A;
    offset += fontCharWidths[charPos] || 0;
    offset += SPACING;
  })
  return offsets;
}

function findChar(offsets, x) {
  var l=offsets.length;
  var i;
  for(i=0;i<l;i++) {
    if (x < offsets[i+1]) {
      return i;
    }
  }
  return l - 1;
}

function convertLine(line) {
  if (line === '') { return; }
  const fullLine = `console.log("${line}")`;
  var fuck = JSFuck.encode(fullLine, true);
  console.log(fuck.length);
  var codePointer = 0;
  var rows = 0;
  var result = "";
  
  var darkPixels = pixelsPerLine(line);
  var lines = Math.floor((fuck.length + darkPixels) / LINE_LENGTH);
  console.log(lines);
  
  var textLen = textLength(line);
  var startX = Math.floor((LINE_LENGTH - textLen) / 2);
  var startY = (lines - FONT_CHAR_HEIGHT) / 2;
  var endX = startX + textLen;
  var endY = startY + FONT_CHAR_HEIGHT;
  var offsets = charOffsets(line);
  console.log("OFFSETS", offsets);
  
  
  console.log("text starts at x:", startX, endX, "y: ", startY, endY, line, line.length, darkPixels, lines);
  
  
  
  while(codePointer < fuck.length) {
    var cols;
    for(cols = 0; cols<LINE_LENGTH; cols++) {
      var paintPixel = true;
      if (cols >= startX && cols < endX && rows >= startY && rows < endY) {
        var charIndex = findChar(offsets, cols - startX)
        var charToPaint = line[charIndex].toUpperCase();
        
        var charOffset = charToPaint.charCodeAt(0) - ASCII_A;
        
        var xOffsetWithinChar = Math.floor((cols - startX) - offsets[charIndex]); 
        var yOffsetWithinChar = Math.floor(yOffsetWithinChar = (rows - startY) % FONT_CHAR_HEIGHT) + 1; // remove measuring pixel
        if (xOffsetWithinChar < fontCharWidths[charOffset]) {
          paintPixel = fontpixels.data[yOffsetWithinChar * fontpixels.width * 4 + (fontCharOffsets[charOffset] + xOffsetWithinChar) * 4] > 0;
        }        
      }
      if (paintPixel) {
        result += fuck[codePointer++] || "";
      } else {
        result += " ";
      }
    }
    result += "\n";
    rows++;
  }
  console.log(result);
  eval(fuck);
  eval(result);
}



// []+[])[!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+!+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+([![]]+[][[]])[+!+[]+[+[]]]+(![]+[])[!+[]+!+[]]+(!!