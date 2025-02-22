
const audioInput = document.getElementById('audioInput');
const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');
let currentVisualizer = 'bars';
let visualizerColorStyle = "default";
const colorStyles = ["default", "cool", "warm", "neon", "pastel"];
let colorIndex = 0;

canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.6;

audioInput.addEventListener('change', handleAudioInput);


const dropdown = document.querySelector('.custom-dropdown');
const selectedOption = dropdown.querySelector('.selected-option');
const options = dropdown.querySelectorAll('.dropdown-options li');

selectedOption.addEventListener('click', () => {
  dropdown.classList.toggle('active');
});

options.forEach(option => {
  option.addEventListener('click', () => {
    const value = option.getAttribute('data-value');
    selectedOption.textContent = option.textContent;
    selectedOption.setAttribute('data-value', value);
    currentVisualizer = value;
    dropdown.classList.remove('active');
    if (currentVisualizer === 'particles') {
      initParticles();
    }
  });
});

document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});


const colorButton = document.querySelector('.color-button');
colorButton.addEventListener('click', () => {
  colorIndex = (colorIndex + 1) % colorStyles.length;
  visualizerColorStyle = colorStyles[colorIndex];
  colorButton.classList.add('clicked');
  setTimeout(() => { colorButton.classList.remove('clicked'); }, 200);
});


let audioContext, analyser, sourceNode, bufferLength, dataArray;
audioInput.addEventListener('change', handleAudioInput);
function handleAudioInput(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const audioBuffer = e.target.result;
      setUpAudioContext(audioBuffer);
    };
    reader.readAsArrayBuffer(file);
  }
}
function setUpAudioContext(audioBuffer) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  audioContext.decodeAudioData(audioBuffer, (buffer) => {
    if (sourceNode) sourceNode.disconnect();
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
    sourceNode.start();
    animate();
  });
}


const particles = [];
const particleCount = 100;
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.baseSize = Math.random() * 3 + 1;
    this.size = this.baseSize;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = Math.random() * 2 - 1;
    this.alpha = 0.3;
  }
  update(amplitude = 0) {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    this.size = this.baseSize + (amplitude / 255) * this.baseSize * 2;
    this.alpha = 0.3 + (amplitude / 255) * 0.7;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
    ctx.fill();
  }
}
function initParticles() {
  particles.length = 0;
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}
initParticles();


function getGradient(x, barHeight, barWidth) {
  let gradient;
  switch (visualizerColorStyle) {
    case "default":
      gradient = ctx.createLinearGradient(x, canvas.height - barHeight, x + barWidth, canvas.height);
      gradient.addColorStop(0, `hsl(${barHeight + 100}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${barHeight + 200}, 100%, 50%)`);
      break;
    case "cool":
      gradient = ctx.createLinearGradient(x, canvas.height - barHeight, x + barWidth, canvas.height);
      gradient.addColorStop(0, "rgba(0,150,255,1)");
      gradient.addColorStop(1, "rgba(0,255,200,1)");
      break;
    case "warm":
      gradient = ctx.createLinearGradient(x, canvas.height - barHeight, x + barWidth, canvas.height);
      gradient.addColorStop(0, "rgba(255,100,0,1)");
      gradient.addColorStop(1, "rgba(255,200,0,1)");
      break;
    case "neon":
      gradient = ctx.createLinearGradient(x, canvas.height - barHeight, x + barWidth, canvas.height);
      gradient.addColorStop(0, "rgba(57,255,20,1)");
      gradient.addColorStop(1, "rgba(0,255,255,1)");
      break;
    case "pastel":
      gradient = ctx.createLinearGradient(x, canvas.height - barHeight, x + barWidth, canvas.height);
      gradient.addColorStop(0, "rgba(255,182,193,1)");
      gradient.addColorStop(1, "rgba(173,216,230,1)");
      break;
    default:
      gradient = ctx.createLinearGradient(x, canvas.height - barHeight, x + barWidth, canvas.height);
      gradient.addColorStop(0, `hsl(${barHeight + 100}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${barHeight + 200}, 100%, 50%)`);
  }
  return gradient;
}


function animate() {
  requestAnimationFrame(animate);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!analyser) return;
  analyser.getByteFrequencyData(dataArray);
  if (currentVisualizer === 'bars') {
    const barWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] * 2;
      let fill = getGradient(x, barHeight, barWidth);
      ctx.fillStyle = fill;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  } else if (currentVisualizer === 'wave') {
    ctx.beginPath();
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i];
      const y = canvas.height / 2 + ((v - 128) / 128) * (canvas.height / 2 * 0.8);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = visualizerColorStyle === "default" ? "#ff6f61" : "#007aff";
    ctx.stroke();
  } else if (currentVisualizer === 'particles') {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) { sum += dataArray[i]; }
    const avgAmplitude = sum / dataArray.length;
    particles.forEach(p => { p.update(avgAmplitude); p.draw(); });
  } else if (currentVisualizer === 'circle') {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;
    const stepAngle = (2 * Math.PI) / bufferLength;
    for (let i = 0; i < bufferLength; i++) {
      const amplitude = dataArray[i];
      const radius = (amplitude / 255) * maxRadius;
      const angle = i * stepAngle;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = getGradient(x, amplitude * 2, 10);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (currentVisualizer === 'spiral') {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let angle = 0, radius = 0;
    const maxRadius = Math.min(centerX, centerY);
    const angleStep = 0.3;
    for (let i = 0; i < bufferLength; i++) {
      const amplitude = dataArray[i];
      radius += maxRadius / bufferLength;
      angle += angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, (amplitude / 255) * 20, 0, Math.PI * 2);
      ctx.fillStyle = visualizerColorStyle === "default" ? `rgba(255,${Math.floor(amplitude)},0,0.7)` : "#007aff";
      ctx.fill();
    }
  }
}

// --- Custom Cursor Movement ---
const customCursor = document.querySelector('.custom-cursor');
document.addEventListener('mousemove', (e) => {
  customCursor.style.top = e.clientY + 'px';
  customCursor.style.left = e.clientX + 'px';
});
