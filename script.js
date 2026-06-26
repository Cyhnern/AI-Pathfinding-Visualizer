const gridContainer = document.getElementById('grid-container');
const rows = 20;
const cols = 20;

let startNode = null;
let endNode = null;
let isMousePressed = false;
let isRunning = false;

// İstatistikler ve Ayarlar
const visitedCountEl = document.getElementById('visited-count');
const timeSpentEl = document.getElementById('time-spent');
const pathLengthEl = document.getElementById('path-length');
const speedSlider = document.getElementById('speed-slider');
const toolSelect = document.getElementById('tool-select');

function createGrid() {
    if (isRunning) return;
    gridContainer.innerHTML = ''; 
    startNode = null;
    endNode = null;
    resetStats();

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const node = document.createElement('div');
            node.classList.add('node');
            node.id = `node-${r}-${c}`;
            node.dataset.row = r;
            node.dataset.col = c;

            node.addEventListener('mousedown', (e) => handleMouseDown(node, e));
            node.addEventListener('mouseenter', () => handleMouseEnter(node));
            
            gridContainer.appendChild(node);
        }
    }
}

function resetStats() {
    visitedCountEl.innerText = '0';
    timeSpentEl.innerText = '0 ms';
    pathLengthEl.innerText = '0';
}

function getDelay() {
    const sliderVal = parseInt(speedSlider.value);
    return Math.max(1, 101 - sliderVal); 
}

function handleMouseDown(node, event) {
    if (isRunning) return;
    event.preventDefault();
    isMousePressed = true;

    if (!startNode && !node.classList.contains('wall') && !node.classList.contains('weight-node')) {
        startNode = node;
        node.style.backgroundColor = '#28a745'; 
        return;
    }

    if (startNode && !endNode && node !== startNode && !node.classList.contains('wall') && !node.classList.contains('weight-node')) {
        endNode = node;
        node.style.backgroundColor = '#dc3545'; 
        return;
    }

    if (node !== startNode && node !== endNode) {
        drawTool(node);
    }
}

function handleMouseEnter(node) {
    if (!isMousePressed || isRunning) return;
    if (node !== startNode && node !== endNode) {
        drawTool(node);
    }
}

window.addEventListener('mouseup', () => { isMousePressed = false; });

function drawTool(node) {
    const currentTool = toolSelect.value;

    if (currentTool === 'wall') {
        node.classList.remove('weight-node');
        if (node.classList.contains('wall')) {
            node.classList.remove('wall');
            node.style.backgroundColor = 'white';
        } else {
            node.classList.add('wall');
            node.style.backgroundColor = '#343a40'; 
        }
    } else if (currentTool === 'weight') {
        node.classList.remove('wall');
        if (node.classList.contains('weight-node')) {
            node.classList.remove('weight-node');
            node.style.backgroundColor = 'white';
        } else {
            node.classList.add('weight-node');
        }
    }
}

function getNodeWeight(node) {
    if (node.classList.contains('weight-node')) return 5; 
    return 1; 
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function getNeighbors(row, col) {
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
            const neighbor = document.getElementById(`node-${newRow}-${newCol}`);
            if (!neighbor.classList.contains('wall')) {
                neighbors.push(neighbor);
            }
        }
    }
    return neighbors;
}

async function drawPath(parentMap) {
    let current = `${endNode.dataset.row}-${endNode.dataset.col}`;
    const startKey = `${startNode.dataset.row}-${startNode.dataset.col}`;
    let totalCost = 0;
    
    if (!parentMap[current]) return;

    while (parentMap[current] && parentMap[current] !== startKey) {
        current = parentMap[current];
        const [r, c] = current.split('-');
        const pathNode = document.getElementById(`node-${r}-${c}`);
        
        totalCost += getNodeWeight(pathNode);
        
        if (pathNode !== startNode && pathNode !== endNode) {
            pathNode.style.backgroundColor = '#007bff'; 
        }
        await sleep(getDelay());
    }
    totalCost += getNodeWeight(endNode); 
    totalCost += getNodeWeight(startNode); 
    pathLengthEl.innerText = totalCost;
}

// 🟩 BFS
async function runBFS() {
    const queue = [startNode];
    const visited = new Set();
    const parentMap = {};
    let visitedCount = 0;

    const startKey = `${startNode.dataset.row}-${startNode.dataset.col}`;
    visited.add(startKey);

    while (queue.length > 0) {
        const current = queue.shift();

        if (current === endNode) {
            await drawPath(parentMap);
            return true;
        }

        if (current !== startNode) {
            if (!current.classList.contains('weight-node')) current.style.backgroundColor = '#ffc107';
            visitedCount++;
            visitedCountEl.innerText = visitedCount;
            await sleep(getDelay());
        }

        const r = parseInt(current.dataset.row);
        const c = parseInt(current.dataset.col);
        const currentKey = `${r}-${c}`;

        for (const neighbor of getNeighbors(r, c)) {
            const nKey = `${neighbor.dataset.row}-${neighbor.dataset.col}`;
            if (!visited.has(nKey)) {
                visited.add(nKey);
                parentMap[nKey] = currentKey;
                queue.push(neighbor);
            }
        }
    }
    return false;
}

// 🟦 DFS
async function runDFS() {
    const stack = [startNode];
    const visited = new Set();
    const parentMap = {};
    let visitedCount = 0;

    while (stack.length > 0) {
        const current = stack.pop();
        const r = parseInt(current.dataset.row);
        const c = parseInt(current.dataset.col);
        const currentKey = `${r}-${c}`;

        if (current === endNode) {
            await drawPath(parentMap);
            return true;
        }

        if (!visited.has(currentKey)) {
            visited.add(currentKey);

            if (current !== startNode) {
                if (!current.classList.contains('weight-node')) current.style.backgroundColor = '#ffc107';
                visitedCount++;
                visitedCountEl.innerText = visitedCount;
                await sleep(getDelay());
            }

            for (const neighbor of getNeighbors(r, c)) {
                const nKey = `${neighbor.dataset.row}-${neighbor.dataset.col}`;
                if (!visited.has(nKey)) {
                    parentMap[nKey] = currentKey;
                    stack.push(neighbor);
                }
            }
        }
    }
    return false;
}

// 🟨 DIJKSTRA
async function runDijkstra() {
    const openSet = [startNode];
    const parentMap = {};
    const distances = {};
    const visited = new Set();
    let visitedCount = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            distances[`${r}-${c}`] = Infinity;
        }
    }
    distances[`${startNode.dataset.row}-${startNode.dataset.col}`] = 0;

    while (openSet.length > 0) {
        openSet.sort((a, b) => distances[`${a.dataset.row}-${a.dataset.col}`] - distances[`${b.dataset.row}-${b.dataset.col}`]);
        const current = openSet.shift();
        const currentKey = `${current.dataset.row}-${current.dataset.col}`;

        if (current === endNode) {
            await drawPath(parentMap);
            return true;
        }

        if (visited.has(currentKey)) continue;
        visited.add(currentKey);

        if (current !== startNode) {
            if (!current.classList.contains('weight-node')) current.style.backgroundColor = '#ffc107';
            visitedCount++;
            visitedCountEl.innerText = visitedCount;
            await sleep(getDelay());
        }

        const r = parseInt(current.dataset.row);
        const c = parseInt(current.dataset.col);

        for (const neighbor of getNeighbors(r, c)) {
            const nKey = `${neighbor.dataset.row}-${neighbor.dataset.col}`;
            if (visited.has(nKey)) continue;

            const weight = getNodeWeight(neighbor); 
            const altDist = distances[currentKey] + weight; 
            
            if (altDist < distances[nKey]) {
                distances[nKey] = altDist;
                parentMap[nKey] = currentKey;
                openSet.push(neighbor);
            }
        }
    }
    return false;
}

// 💜 A* SEARCH
function manhattanDistance(nodeA, nodeB) {
    return Math.abs(parseInt(nodeA.dataset.row) - parseInt(nodeB.dataset.row)) + 
           Math.abs(parseInt(nodeA.dataset.col) - parseInt(nodeB.dataset.col));
}

async function runAStar() {
    const openSet = [startNode];
    const parentMap = {};
    const gScore = {}; 
    const fScore = {}; 
    const visited = new Set();
    let visitedCount = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const key = `${r}-${c}`;
            gScore[key] = Infinity;
            fScore[key] = Infinity;
        }
    }

    const startKey = `${startNode.dataset.row}-${startNode.dataset.col}`;
    gScore[startKey] = 0;
    fScore[startKey] = manhattanDistance(startNode, endNode);

    while (openSet.length > 0) {
        openSet.sort((a, b) => fScore[`${a.dataset.row}-${a.dataset.col}`] - fScore[`${b.dataset.row}-${b.dataset.col}`]);
        const current = openSet.shift();
        const currentKey = `${current.dataset.row}-${current.dataset.col}`;

        if (current === endNode) {
            await drawPath(parentMap);
            return true;
        }

        if (visited.has(currentKey)) continue;
        visited.add(currentKey);

        if (current !== startNode) {
            if (!current.classList.contains('weight-node')) current.style.backgroundColor = '#ffc107';
            visitedCount++;
            visitedCountEl.innerText = visitedCount;
            await sleep(getDelay());
        }

        const r = parseInt(current.dataset.row);
        const c = parseInt(current.dataset.col);

        for (const neighbor of getNeighbors(r, c)) {
            const nKey = `${neighbor.dataset.row}-${neighbor.dataset.col}`;
            if (visited.has(nKey)) continue;

            const weight = getNodeWeight(neighbor); 
            const tentativeGScore = gScore[currentKey] + weight;

            if (tentativeGScore < gScore[nKey]) {
                parentMap[nKey] = currentKey;
                gScore[nKey] = tentativeGScore;
                fScore[nKey] = gScore[nKey] + manhattanDistance(neighbor, endNode);
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    return false;
}

// 🌀 LABİRENT OLUŞTURUCU
function generateRandomMaze() {
    if (isRunning) return;
    createGrid(); 

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (Math.random() < 0.25) {
                const node = document.getElementById(`node-${r}-${c}`);
                node.classList.add('wall');
                node.style.backgroundColor = '#343a40';
            }
        }
    }
}

// BAĞLAYICILAR
document.getElementById('visualize-btn').addEventListener('click', async () => {
    if (isRunning) return;
    if (!startNode || !endNode) {
        alert("Lütfen önce haritada Başlangıç (Yeşil) ve Bitiş (Kırmızı) noktalarını seçin!");
        return;
    }

    const algoSelect = document.getElementById('algorithm-select').value;
    if (algoSelect === 'none') {
        alert("Lütfen listeden bir algoritma seçin!");
        return;
    }

    isRunning = true;
    resetStats();
    
    const startTime = performance.now();
    let found = false;

    if (algoSelect === 'bfs') found = await runBFS();
    else if (algoSelect === 'dfs') found = await runDFS();
    else if (algoSelect === 'dijkstra') found = await runDijkstra();
    else if (algoSelect === 'astar') found = await runAStar();

    const endTime = performance.now();
    if (found) {
        timeSpentEl.innerText = `${(endTime - startTime).toFixed(0)} ms`;
    } else {
        alert("Bitiş noktasına ulaşan bir yol bulunamadı!");
    }
    isRunning = false;
});

document.getElementById('maze-btn').addEventListener('click', generateRandomMaze);
document.getElementById('clear-btn').addEventListener('click', createGrid);

// SAYFA YÜKLENDİĞİNDE BAŞLAT
window.addEventListener('DOMContentLoaded', () => {
    createGrid();
});