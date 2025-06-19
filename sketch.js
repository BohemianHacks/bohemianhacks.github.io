function draw() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.fillStyle = 'white';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const waveCount = 5;
  const maxAmplitude = canvas.height / 4;
  let amplitude;
  let centerX;
  let randomColor;

  for (let x = 10; x < canvas.width - 10; x += 20) {
    amplitude = Math.random() * maxAmplitude;
    centerX = x + Math.random() * 30 - 15;
    randomColor = `hsl(${Math.random() * 360}, 75%, 80%)`;

    for (let y = -amplitude; y < canvas.height + amplitude; y += maxAmplitude / 2) {
      ctx.fillStyle = randomColor;
      ctx.fillRect(x, y, 5, Math.abs(y - (canvas.height - centerX)));
    }
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

