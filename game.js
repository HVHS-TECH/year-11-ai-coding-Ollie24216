(() => {
	const canvas = document.getElementById('game');
	const ctx = canvas.getContext('2d');

	// Logical size
	const WIDTH = 900;
	const HEIGHT = 500;

	// High-DPI support
	const DPR = Math.max(window.devicePixelRatio || 1, 1);
	canvas.width = WIDTH * DPR;
	canvas.height = HEIGHT * DPR;
	canvas.style.width = WIDTH + 'px';
	canvas.style.height = HEIGHT + 'px';
	ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

	const paddle = {w:12, h:100, speed:6};
	const left = {x:10, y:(HEIGHT - 100)/2, dy:0};
	const right = {x:WIDTH - 10 - paddle.w, y:(HEIGHT - 100)/2, dy:0};

	const ball = {r:22, x:WIDTH/2, y:HEIGHT/2, vx:6, vy:2};

	let running = false;
	let leftScore = 0, rightScore = 0;
	const scoreEl = document.getElementById('score');

	const keys = {};

	function resetBall(toLeft=false){
		ball.x = WIDTH/2; ball.y = HEIGHT/2;
		const speed = 6;
		const angle = (Math.random() * Math.PI/3) - Math.PI/6; // -30..30 deg
		ball.vx = (toLeft ? -1:1) * speed * Math.cos(angle);
		ball.vy = speed * Math.sin(angle);
	}

	function update(){
		// paddles movement
		left.y += left.dy;
		right.y += right.dy;
		// clamp
		left.y = Math.max(0, Math.min(HEIGHT - paddle.h, left.y));
		right.y = Math.max(0, Math.min(HEIGHT - paddle.h, right.y));

		// simple AI for right paddle when no user input
		if (!keys.ArrowUp && !keys.ArrowDown) {
			const target = ball.y - paddle.h/2;
			if (right.y + 4 < target) right.y += 4;
			else if (right.y - 4 > target) right.y -= 4;
		}

		// ball physics
		ball.x += ball.vx;
		ball.y += ball.vy;

		// top/bottom
		if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; }
		if (ball.y + ball.r > HEIGHT) { ball.y = HEIGHT - ball.r; ball.vy *= -1; }

		// left paddle collision
		if (ball.x - ball.r < left.x + paddle.w) {
			if (ball.y > left.y && ball.y < left.y + paddle.h) {
				ball.x = left.x + paddle.w + ball.r;
				ball.vx = Math.abs(ball.vx) * 1.03;
				// add spin based on where it hit the paddle
				const n = (ball.y - (left.y + paddle.h/2)) / (paddle.h/2);
				ball.vy += n * 3;
			}
		}

		// right paddle collision
		if (ball.x + ball.r > right.x) {
			if (ball.y > right.y && ball.y < right.y + paddle.h) {
				ball.x = right.x - ball.r;
				ball.vx = -Math.abs(ball.vx) * 1.03;
				const n = (ball.y - (right.y + paddle.h/2)) / (paddle.h/2);
				ball.vy += n * 3;
			}
		}

		// scoring
		if (ball.x + ball.r < 0) {
			rightScore +=1; updateScore(); resetBall(true);
		}
		if (ball.x - ball.r > WIDTH) {
			leftScore +=1; updateScore(); resetBall(false);
		}
	}

	function updateScore(){
		scoreEl.textContent = `${leftScore} : ${rightScore}`;
	}

	function drawBackground(t){
		// base gradient
		const g = ctx.createLinearGradient(0,0,WIDTH,HEIGHT);
		g.addColorStop(0,'#f4e7c3');
		g.addColorStop(0.5,'#e1c877');
		g.addColorStop(1,'#f9e9c8');
		ctx.fillStyle = g;
		ctx.fillRect(0,0,WIDTH,HEIGHT);

		// moving oily shimmer
		const sx = (Math.sin(t/900) + 1) / 2 * WIDTH;
		const rg = ctx.createRadialGradient(sx, HEIGHT*0.25, 10, sx, HEIGHT*0.25, WIDTH*0.9);
		rg.addColorStop(0, 'rgba(255,255,255,0.18)');
		rg.addColorStop(0.35, 'rgba(255,255,255,0.06)');
		rg.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = rg;
		ctx.fillRect(0,0,WIDTH,HEIGHT);
	}

	function draw(){
		const now = performance.now();
		drawBackground(now);

		// center dotted line
		ctx.strokeStyle = 'rgba(0,0,0,0.12)';
		ctx.setLineDash([6,10]);
		ctx.lineWidth = 2;
		ctx.beginPath(); ctx.moveTo(WIDTH/2,20); ctx.lineTo(WIDTH/2, HEIGHT-20); ctx.stroke();
		ctx.setLineDash([]);

		// paddles
		ctx.fillStyle = '#ffffffcc';
		ctx.fillRect(left.x, left.y, paddle.w, paddle.h);
		ctx.fillRect(right.x, right.y, paddle.w, paddle.h);

		// draw poo ball as emoji for fun
		ctx.font = `${ball.r*2}px serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('💩', ball.x, ball.y + 2);
	}

	function loop(){
		if (running) {
			update();
			draw();
			requestAnimationFrame(loop);
		}
	}

	// controls
	window.addEventListener('keydown', (e) => {
		keys[e.key] = true;
		if (e.key === 'w' || e.key === 'W') left.dy = -paddle.speed;
		if (e.key === 's' || e.key === 'S') left.dy = paddle.speed;
		if (e.key === 'ArrowUp') right.dy = -paddle.speed;
		if (e.key === 'ArrowDown') right.dy = paddle.speed;
	});
	window.addEventListener('keyup', (e) => {
		keys[e.key] = false;
		if (e.key === 'w' || e.key === 'W') { if (!keys['s'] && !keys['S']) left.dy = 0; else left.dy = paddle.speed; }
		if (e.key === 's' || e.key === 'S') { if (!keys['w'] && !keys['W']) left.dy = 0; else left.dy = -paddle.speed; }
		if (e.key === 'ArrowUp') { if (!keys['ArrowDown']) right.dy = 0; else right.dy = paddle.speed; }
		if (e.key === 'ArrowDown') { if (!keys['ArrowUp']) right.dy = 0; else right.dy = -paddle.speed; }
	});

	// buttons
	document.getElementById('start').addEventListener('click', ()=>{
		if (!running) { running = true; loop(); document.getElementById('start').textContent = 'Pause'; }
		else { running = false; document.getElementById('start').textContent = 'Start'; }
	});
	document.getElementById('reset').addEventListener('click', ()=>{
		running = false; document.getElementById('start').textContent = 'Start'; leftScore = 0; rightScore = 0; updateScore(); left.y = right.y = (HEIGHT - paddle.h)/2; resetBall(); draw();
	});

	// initial draw
	updateScore(); resetBall(); draw();
	console.log('Poo Pong ready');
})();