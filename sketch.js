let video; // Renamed from 'capture' to 'video' for consistency with ml5 example
let faceMesh;
let faces = [];

function preload() {
  // Initialize FaceMesh model with a maximum of one face.
  // 'flipped: false' because the video input from createCapture will NOT be flipped initially.
  // The mirroring will be applied by p5.js's transformation matrix in draw().
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: false });
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  // Do NOT use { flipped: true } here, as we will apply mirroring via p5.js's transformation matrix.
  video = createCapture(VIDEO);
  // 隱藏預設產生的 HTML video 元素，只在 canvas 內繪製
  video.hide();

  // Start detecting faces
  // The 'gotFaces' callback will be called when faces are detected.
  faceMesh.detectStart(video, gotFaces);
}

// Callback function for when face data is received from ml5.js
function gotFaces(results) {
  faces = results;
}

// Function called when the mouse is pressed
function mousePressed() {
  // Log detected face data to the console
  console.log(faces);
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');

  // 計算顯示寬高 (全螢幕的 50%)
  let displayWidth = windowWidth * 0.5;
  let displayHeight = windowHeight * 0.5;
  // 計算置中座標
  let x = (windowWidth - displayWidth) / 2;
  let y = (windowHeight - displayHeight) / 2;

  push();
  // 實作左右顛倒：平移到目標區域的右緣，並水平縮放 -1。
  // 這裡的 translate(x + displayWidth, y) 是為了讓 scale(-1, 1) 作用後，
  // 影像的左上角 (0,0) 仍然對應到畫布上的 (x,y) 區域的左上角。
  // 也就是說，影像會從 (x,y) 繪製到 (x+displayWidth, y+displayHeight)，但內容是左右顛倒的。
  translate(x + displayWidth, y);
  scale(-1, 1);
  image(video, 0, 0, displayWidth, displayHeight);
  pop();

  // 確保至少偵測到一張臉
  if (faces.length > 0) {
    let face = faces[0];

    // 指定要串接的臉部特徵點索引 (嘴唇輪廓)
    let lipIndices = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];

    stroke(255, 0, 0); // 設定線條顏色為紅色
    strokeWeight(15);  // 設定粗細為 15
    strokeJoin(ROUND); // 讓線條轉折處較平滑
    noFill();

    // 使用 line 指令串接指定的特徵點
    for (let i = 0; i < lipIndices.length - 1; i++) {
      let p1 = face.keypoints[lipIndices[i]];
      let p2 = face.keypoints[lipIndices[i + 1]];

      // 計算對應到畫布中央 50% 影像且左右顛倒的座標
      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);

      line(x1, y1, x2, y2);
    }

    // --- 繪製新的特徵點連線 (細紅線) ---
    let upperFaceIndices = [76, 77, 90, 180, 85, 16, 315, 404, 320, 307, 306, 408, 304, 303, 302, 11, 72, 73, 74, 184];
    
    strokeWeight(1); // 設定細線粗細為 1
    
    for (let i = 0; i < upperFaceIndices.length - 1; i++) {
      let p1 = face.keypoints[upperFaceIndices[i]];
      let p2 = face.keypoints[upperFaceIndices[i + 1]];

      // 同樣計算對應到畫布中央影像的鏡像座標
      let x1 = x + displayWidth - (p1.x * (displayWidth / video.width));
      let y1 = y + p1.y * (displayHeight / video.height);
      let x2 = x + displayWidth - (p2.x * (displayWidth / video.width));
      let y2 = y + p2.y * (displayHeight / video.height);

      line(x1, y1, x2, y2);
    }
  }
}
