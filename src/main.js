import * as THREE from 'three';

// Player info
const playerInfo = {
    id: Math.random().toString(36).substring(2, 9), // Generate random ID
    name: `Player_${Math.floor(Math.random() * 1000)}`,
    color: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color
};

// Game state
const gameState = {
    speed: 0,
    acceleration: 0,
    turning: 0,
    maxSpeed: 1,
    friction: 0.98,
    accelerationRate: 0.05,
    turningRate: 0.03,
    score: 0,
    nitroActive: false,
    nitroCooldown: false,
    nitroStartTime: 0,
    normalMaxSpeed: 1,
    nitroMaxSpeed: 3,
    normalAcceleration: 0.05,
    nitroAcceleration: 0.15,
    lastUpdateSent: 0
};

// Store other players
const otherPlayers = {};

// WebSocket setup
let socket;
let isConnected = false;

// Connect to WebSocket server
function setupMultiplayer() {
    // Display connection UI
    const connectionUI = document.createElement('div');
    connectionUI.style.position = 'fixed';
    connectionUI.style.top = '50%';
    connectionUI.style.left = '50%';
    connectionUI.style.transform = 'translate(-50%, -50%)';
    connectionUI.style.background = 'rgba(0, 0, 0, 0.8)';
    connectionUI.style.color = 'white';
    connectionUI.style.padding = '20px';
    connectionUI.style.borderRadius = '10px';
    connectionUI.style.zIndex = '1000';
    connectionUI.style.fontFamily = 'Arial, sans-serif';
    connectionUI.style.textAlign = 'center';
    
    const heading = document.createElement('h2');
    heading.textContent = 'Racing Game Multiplayer';
    connectionUI.appendChild(heading);
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Enter your name';
    nameInput.value = playerInfo.name;
    nameInput.style.display = 'block';
    nameInput.style.margin = '10px auto';
    nameInput.style.padding = '5px';
    nameInput.style.width = '200px';
    connectionUI.appendChild(nameInput);
    
    const serverInput = document.createElement('input');
    serverInput.type = 'text';
    serverInput.placeholder = 'WebSocket server (default: echo server)';
    serverInput.value = 'wss://demos.kaazing.com/echo';
    serverInput.style.display = 'block';
    serverInput.style.margin = '10px auto';
    serverInput.style.padding = '5px';
    serverInput.style.width = '300px';
    connectionUI.appendChild(serverInput);
    
    const connectButton = document.createElement('button');
    connectButton.textContent = 'Connect';
    connectButton.style.padding = '8px 20px';
    connectButton.style.backgroundColor = '#4CAF50';
    connectButton.style.border = 'none';
    connectButton.style.color = 'white';
    connectButton.style.cursor = 'pointer';
    connectButton.style.borderRadius = '4px';
    connectButton.style.margin = '10px auto';
    connectButton.style.display = 'block';
    connectionUI.appendChild(connectButton);
    
    const statusText = document.createElement('div');
    statusText.textContent = 'Not connected';
    statusText.style.marginTop = '10px';
    connectionUI.appendChild(statusText);
    
    document.body.appendChild(connectionUI);
    
    // Handle connection button click
    connectButton.addEventListener('click', () => {
        playerInfo.name = nameInput.value || playerInfo.name;
        const serverUrl = serverInput.value || 'wss://demos.kaazing.com/echo';
        
        statusText.textContent = 'Connecting...';
        connectButton.disabled = true;
        
        // Connect to WebSocket server
        try {
            socket = new WebSocket(serverUrl);
            
            socket.onopen = function() {
                isConnected = true;
                statusText.textContent = 'Connected!';
                document.body.removeChild(connectionUI);
                
                // Create player list UI
                createPlayerListUI();
                
                // Send initial player info
                sendPlayerUpdate();
            };
            
            socket.onmessage = function(event) {
                handleMessage(event.data);
            };
            
            socket.onerror = function(error) {
                statusText.textContent = 'Connection error!';
                connectButton.disabled = false;
                console.error('WebSocket error:', error);
            };
            
            socket.onclose = function() {
                isConnected = false;
                statusText.textContent = 'Connection closed.';
                connectButton.disabled = false;
            };
        } catch (error) {
            statusText.textContent = 'Failed to connect!';
            connectButton.disabled = false;
            console.error('Connection setup error:', error);
        }
    });
}

// Player list UI
function createPlayerListUI() {
    const playerList = document.createElement('div');
    playerList.id = 'playerList';
    playerList.style.position = 'fixed';
    playerList.style.top = '20px';
    playerList.style.right = '20px';
    playerList.style.background = 'rgba(0, 0, 0, 0.5)';
    playerList.style.color = 'white';
    playerList.style.padding = '10px';
    playerList.style.borderRadius = '5px';
    playerList.style.maxHeight = '300px';
    playerList.style.overflowY = 'auto';
    playerList.style.fontFamily = 'Arial, sans-serif';
    playerList.style.zIndex = '100';
    playerList.style.width = '200px';
    
    const title = document.createElement('h3');
    title.textContent = 'Players Online';
    title.style.margin = '0 0 10px 0';
    title.style.textAlign = 'center';
    playerList.appendChild(title);
    
    const playerListItems = document.createElement('ul');
    playerListItems.id = 'playerListItems';
    playerListItems.style.listStyle = 'none';
    playerListItems.style.padding = '0';
    playerListItems.style.margin = '0';
    playerList.appendChild(playerListItems);
    
    document.body.appendChild(playerList);
    
    // Add myself to the list
    updatePlayerList();
}

// Update the player list UI
function updatePlayerList() {
    const playerListItems = document.getElementById('playerListItems');
    if (!playerListItems) return;
    
    // Clear the list
    playerListItems.innerHTML = '';
    
    // Add myself
    const myItem = document.createElement('li');
    myItem.style.padding = '5px';
    myItem.style.marginBottom = '5px';
    myItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    myItem.style.borderRadius = '3px';
    myItem.style.position = 'relative';
    
    const colorDot = document.createElement('span');
    colorDot.style.display = 'inline-block';
    colorDot.style.width = '10px';
    colorDot.style.height = '10px';
    colorDot.style.borderRadius = '50%';
    colorDot.style.backgroundColor = playerInfo.color;
    colorDot.style.marginRight = '5px';
    
    myItem.appendChild(colorDot);
    myItem.appendChild(document.createTextNode(`${playerInfo.name} (You)`));
    myItem.style.fontWeight = 'bold';
    playerListItems.appendChild(myItem);
    
    // Add other players
    Object.values(otherPlayers).forEach(player => {
        const playerItem = document.createElement('li');
        playerItem.style.padding = '5px';
        playerItem.style.marginBottom = '5px';
        playerItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        playerItem.style.borderRadius = '3px';
        
        const playerColorDot = document.createElement('span');
        playerColorDot.style.display = 'inline-block';
        playerColorDot.style.width = '10px';
        playerColorDot.style.height = '10px';
        playerColorDot.style.borderRadius = '50%';
        playerColorDot.style.backgroundColor = player.color;
        playerColorDot.style.marginRight = '5px';
        
        playerItem.appendChild(playerColorDot);
        playerItem.appendChild(document.createTextNode(player.name));
        playerListItems.appendChild(playerItem);
    });
}

// Send player update to server
function sendPlayerUpdate() {
    if (!isConnected || !socket) return;
    
    const now = Date.now();
    // Limit updates to 10 per second
    if (now - gameState.lastUpdateSent < 100) return;
    gameState.lastUpdateSent = now;
    
    const message = {
        type: 'player_update',
        id: playerInfo.id,
        name: playerInfo.name,
        color: playerInfo.color,
        position: {
            x: car.position.x,
            y: car.position.y,
            z: car.position.z
        },
        rotation: {
            y: car.rotation.y
        },
        nitro: gameState.nitroActive,
        score: gameState.score
    };
    
    socket.send(JSON.stringify(message));
}

// Handle message from server
function handleMessage(data) {
    try {
        const message = JSON.parse(data);
        
        if (message.type === 'player_update' && message.id !== playerInfo.id) {
            // Update or create other player
            if (!otherPlayers[message.id]) {
                // Create new player car
                otherPlayers[message.id] = {
                    name: message.name,
                    color: message.color,
                    car: createOtherPlayerCar(message.color),
                    position: message.position,
                    rotation: message.rotation,
                    nitro: message.nitro,
                    score: message.score,
                    lastUpdate: Date.now()
                };
                
                scene.add(otherPlayers[message.id].car);
                updatePlayerList();
            } else {
                // Update existing player
                otherPlayers[message.id].position = message.position;
                otherPlayers[message.id].rotation = message.rotation;
                otherPlayers[message.id].nitro = message.nitro;
                otherPlayers[message.id].score = message.score;
                otherPlayers[message.id].lastUpdate = Date.now();
            }
        }
    } catch (error) {
        console.error('Error parsing message:', error);
    }
}

// Create car for other player
function createOtherPlayerCar(carColor) {
    const otherCar = createCar();
    
    // Change car color
    otherCar.traverse(child => {
        if (child instanceof THREE.Mesh && child.material.color) {
            if (child.material.color.getHex() === 0xff0000) { // If it's red (body parts)
                child.material = child.material.clone(); // Clone to avoid affecting other cars
                child.material.color.set(carColor);
            }
        }
    });
    
    return otherCar;
}

// Update other players' positions
function updateOtherPlayers() {
    const now = Date.now();
    
    Object.keys(otherPlayers).forEach(id => {
        const player = otherPlayers[id];
        
        // Remove players that haven't updated in 10 seconds
        if (now - player.lastUpdate > 10000) {
            scene.remove(player.car);
            delete otherPlayers[id];
            updatePlayerList();
            return;
        }
        
        // Update car position and rotation
        player.car.position.set(
            player.position.x,
            player.position.y,
            player.position.z
        );
        player.car.rotation.y = player.rotation.y;
        
        // Add nitro effect if active
        if (player.nitro) {
            const particle = createNitroParticle();
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 1,
                2
            );
            offset.applyQuaternion(player.car.quaternion);
            particle.position.copy(player.car.position).add(offset);
            
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.2,
                Math.random() * 0.2
            );
            particle.lifetime = 1;
            particleSystem.add(particle);
        }
    });
}

// Start multiplayer setup when the page loads
setupMultiplayer();

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Enhanced Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(100, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Create coins
const coins = [];
function createCoin() {
    const geometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 1,
        roughness: 0.3,
        emissive: 0xffd700,
        emissiveIntensity: 0.2
    });
    const coin = new THREE.Mesh(geometry, material);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    return coin;
}

function placeCoinAlongTrack(x, z) {
    const coin = createCoin();
    coin.position.set(x, 2, z);
    coin.collected = false;
    coins.push(coin);
    scene.add(coin);
}

// Place coins along the track
function placeCoins() {
    if (!window.trackPath) return; // Make sure track is created first
    
    const trackPath = window.trackPath;
    const numCoins = 40; // More coins for a longer track
    
    // Place coins spaced out along the track
    for (let i = 0; i < numCoins; i++) {
        // Calculate position along the track
        const pathIndex = Math.floor((i / numCoins) * (trackPath.length - 1));
        const nextPathIndex = (pathIndex + 1) % trackPath.length;
        
        const point = trackPath[pathIndex];
        const nextPoint = trackPath[nextPathIndex];
        
        let x, z;
        
        // For move and line segments, simple linear interpolation
        if (point.type === 'move' || point.type === 'line') {
            const t = (i / numCoins) * (trackPath.length - 1) - pathIndex;
            x = point.x + (nextPoint.x - point.x) * t;
            z = point.y + (nextPoint.y - point.y) * t; // Note: y in canvas = z in 3D
        }
        // For curve segments, use quadratic interpolation
        else if (point.type === 'curve') {
            const t = (i / numCoins) * (trackPath.length - 1) - pathIndex;
            
            // Bezier curve formula
            const oneMinusT = 1 - t;
            x = oneMinusT * oneMinusT * oneMinusT * point.x +
                3 * oneMinusT * oneMinusT * t * point.cp1x +
                3 * oneMinusT * t * t * point.cp2x +
                t * t * t * nextPoint.x;
                
            z = oneMinusT * oneMinusT * oneMinusT * point.y +
                3 * oneMinusT * oneMinusT * t * point.cp1y +
                3 * oneMinusT * t * t * point.cp2y +
                t * t * t * nextPoint.y;
        }
        
        // Convert from canvas coordinates to 3D world coordinates
        const worldX = (x - 1024) / 1024 * 200;
        const worldZ = (z - 1024) / 1024 * 200;
        
        placeCoinAlongTrack(worldX, worldZ);
    }
}

// Create score display
const scoreElement = document.createElement('div');
scoreElement.style.position = 'fixed';
scoreElement.style.top = '20px';
scoreElement.style.left = '20px';
scoreElement.style.color = 'white';
scoreElement.style.fontFamily = 'Arial';
scoreElement.style.fontSize = '24px';
scoreElement.style.background = 'rgba(0, 0, 0, 0.5)';
scoreElement.style.padding = '10px';
scoreElement.style.borderRadius = '5px';
document.body.appendChild(scoreElement);

// Create cooldown display
const cooldownElement = document.createElement('div');
cooldownElement.style.position = 'fixed';
cooldownElement.style.bottom = '20px';
cooldownElement.style.right = '20px';
cooldownElement.style.color = 'white';
cooldownElement.style.fontFamily = 'Arial';
cooldownElement.style.fontSize = '24px';
cooldownElement.style.background = 'rgba(0, 0, 0, 0.5)';
cooldownElement.style.padding = '10px';
cooldownElement.style.borderRadius = '5px';
document.body.appendChild(cooldownElement);

// Create ground with track texture
function createGround() {
    const groundSize = 400; // Larger ground for a bigger track
    const trackWidth = 20;
    
    // Create canvas for track texture
    const canvas = document.createElement('canvas');
    canvas.width = 2048; // Higher resolution
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    
    // Fill background (grass)
    ctx.fillStyle = '#3cb043';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw track
    ctx.fillStyle = '#666666';
    
    // Complex track path
    // We'll define the track using a series of points and curves
    const trackPoints = [];
    
    // Create a professional racing circuit with varied corners and straights
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = canvas.width * 0.8; // Use most of the canvas
    
    // Define track shape with various corner types
    const path = [
        { type: 'move', x: 0.1, y: 0.3 },
        { type: 'line', x: 0.5, y: 0.3 }, // Long straight
        { type: 'curve', x: 0.6, y: 0.2, cp1x: 0.55, cp1y: 0.3, cp2x: 0.6, cp2y: 0.25 }, // Tight corner
        { type: 'line', x: 0.6, y: 0.1 }, // Short straight
        { type: 'curve', x: 0.7, y: 0.1, cp1x: 0.65, cp1y: 0.1, cp2x: 0.7, cp2y: 0.1 }, // Gentle curve
        { type: 'curve', x: 0.8, y: 0.2, cp1x: 0.75, cp1y: 0.1, cp2x: 0.8, cp2y: 0.15 }, // Medium corner
        { type: 'line', x: 0.8, y: 0.4 }, // Medium straight
        { type: 'curve', x: 0.9, y: 0.5, cp1x: 0.8, cp1y: 0.45, cp2x: 0.85, cp2y: 0.5 }, // Sweeping corner
        { type: 'curve', x: 0.8, y: 0.6, cp1x: 0.85, cp1y: 0.55, cp2x: 0.8, cp2y: 0.55 }, // Chicane part 1
        { type: 'curve', x: 0.7, y: 0.7, cp1x: 0.75, cp1y: 0.6, cp2x: 0.75, cp2y: 0.65 }, // Chicane part 2
        { type: 'line', x: 0.5, y: 0.7 }, // Another straight
        { type: 'curve', x: 0.4, y: 0.8, cp1x: 0.45, cp1y: 0.7, cp2x: 0.4, cp2y: 0.75 }, // Corner
        { type: 'curve', x: 0.3, y: 0.7, cp1x: 0.35, cp1y: 0.8, cp2x: 0.35, cp2y: 0.75 }, // Hairpin part 1
        { type: 'curve', x: 0.2, y: 0.6, cp1x: 0.25, cp1y: 0.65, cp2x: 0.2, cp2y: 0.65 }, // Hairpin part 2
        { type: 'curve', x: 0.1, y: 0.4, cp1x: 0.15, cp1y: 0.55, cp2x: 0.1, cp2y: 0.5 }, // Long sweeper
        { type: 'line', x: 0.1, y: 0.3 }  // Back to start
    ];
    
    // Scale points to canvas size and convert to actual coordinates
    const scaledPath = path.map(point => {
        const newPoint = { type: point.type };
        newPoint.x = centerX + (point.x - 0.5) * scale;
        newPoint.y = centerY + (point.y - 0.5) * scale;
        
        if (point.cp1x) {
            newPoint.cp1x = centerX + (point.cp1x - 0.5) * scale;
            newPoint.cp1y = centerY + (point.cp1y - 0.5) * scale;
        }
        
        if (point.cp2x) {
            newPoint.cp2x = centerX + (point.cp2x - 0.5) * scale;
            newPoint.cp2y = centerY + (point.cp2y - 0.5) * scale;
        }
        
        return newPoint;
    });
    
    // Draw the main track
    ctx.beginPath();
    
    // First create the outer track path
    for (let i = 0; i < scaledPath.length; i++) {
        const point = scaledPath[i];
        if (point.type === 'move') {
            ctx.moveTo(point.x, point.y);
        } else if (point.type === 'line') {
            ctx.lineTo(point.x, point.y);
        } else if (point.type === 'curve') {
            ctx.bezierCurveTo(point.cp1x, point.cp1y, point.cp2x, point.cp2y, point.x, point.y);
        }
    }
    
    // Set drawing styles
    ctx.lineWidth = trackWidth * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Add track details - racing line
    ctx.beginPath();
    for (let i = 0; i < scaledPath.length; i++) {
        const point = scaledPath[i];
        if (point.type === 'move') {
            ctx.moveTo(point.x, point.y);
        } else if (point.type === 'line') {
            ctx.lineTo(point.x, point.y);
        } else if (point.type === 'curve') {
            ctx.bezierCurveTo(point.cp1x, point.cp1y, point.cp2x, point.cp2y, point.x, point.y);
        }
    }
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    
    // Add a start/finish line
    const startPoint = {
        x: centerX + (0.1 - 0.5) * scale,
        y: centerY + (0.3 - 0.5) * scale
    };
    const startDir = {
        x: 1,
        y: 0
    };
    
    ctx.setLineDash([]);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#ffffff';
    
    // Draw alternating black and white pattern
    for (let i = -trackWidth; i <= trackWidth; i += 10) {
        const perpX = -startDir.y;
        const perpY = startDir.x;
        
        if ((i / 10) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = '#000000';
        }
        
        ctx.fillRect(
            startPoint.x + perpX * i - 10,
            startPoint.y + perpY * i - 5,
            20,
            10
        );
    }
    
    // Store track path for coin placement
    window.trackPath = scaledPath;
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    // Create ground
    const geometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    return ground;
}

const ground = createGround();
scene.add(ground);

// Place coins after creating the ground
placeCoins();

// Create car
function createCar() {
    const carGroup = new THREE.Group();

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        metalness: 0.6,
        roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    carGroup.add(body);

    // Car top
    const topGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
    const topMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        metalness: 0.6,
        roughness: 0.4
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.4;
    top.position.z = -0.5;
    top.castShadow = true;
    carGroup.add(top);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    const wheelPositions = [
        { x: -1.2, z: -1.2 },
        { x: 1.2, z: -1.2 },
        { x: -1.2, z: 1.2 },
        { x: 1.2, z: 1.2 }
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, 0.4, pos.z);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });

    return carGroup;
}

const car = createCar();
// Position car at the bottom of the track
car.position.set(0, 0.5, 60);
car.rotation.y = -Math.PI / 2; // Face forward (towards the track)
scene.add(car);

// Camera setup
camera.position.set(0, 5, 70); // Start behind car
camera.lookAt(car.position);

// Create nitro particles
const particleSystem = new THREE.Group();
scene.add(particleSystem);

function createNitroParticle() {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xff4500 : 0xff8c00,
        transparent: true,
        opacity: 1
    });
    const particle = new THREE.Mesh(geometry, material);
    return particle;
}

function updateNitroParticles() {
    if (gameState.nitroActive) {
        // Create new particles
        for (let i = 0; i < 3; i++) {
            const particle = createNitroParticle();
            
            // Position behind the car
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 1,
                2
            );
            offset.applyQuaternion(car.quaternion);
            particle.position.copy(car.position).add(offset);
            
            // Add to system with lifetime and velocity
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.2,
                Math.random() * 0.2
            );
            particle.lifetime = 1;
            particleSystem.add(particle);
        }
    }

    // Update existing particles
    for (let i = particleSystem.children.length - 1; i >= 0; i--) {
        const particle = particleSystem.children[i];
        particle.lifetime -= 0.016; // Approx. one frame at 60fps
        
        if (particle.lifetime <= 0) {
            particleSystem.remove(particle);
        } else {
            particle.position.add(particle.velocity);
            particle.material.opacity = particle.lifetime;
            particle.scale.multiplyScalar(0.97);
        }
    }
}

// Add nitro light
const nitroLight = new THREE.PointLight(0xff4500, 0, 20);
scene.add(nitroLight);

// Keyboard state
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false  // Space key
};

// Event listeners
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        
        // Activate nitro on space if not in cooldown
        if (e.key === ' ' && !gameState.nitroCooldown && !gameState.nitroActive) {
            gameState.nitroActive = true;
            gameState.nitroStartTime = Date.now();
            gameState.maxSpeed = gameState.nitroMaxSpeed;
            gameState.accelerationRate = gameState.nitroAcceleration;
            
            // Start cooldown after 3 seconds
            setTimeout(() => {
                gameState.nitroActive = false;
                gameState.maxSpeed = gameState.normalMaxSpeed;
                gameState.accelerationRate = gameState.normalAcceleration;
                gameState.nitroCooldown = true;
                
                setTimeout(() => {
                    gameState.nitroCooldown = false;
                }, 30000); // 30 second cooldown
            }, 3000); // 3 second duration
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Check coin collection
function checkCoinCollection() {
    const collectionDistance = 3;
    coins.forEach(coin => {
        if (!coin.collected) {
            const distance = car.position.distanceTo(coin.position);
            if (distance < collectionDistance) {
                coin.collected = true;
                gameState.score += 10;
                coin.visible = false;
                
                // Create collection effect
                const flash = new THREE.PointLight(0xffd700, 2, 10);
                flash.position.copy(coin.position);
                scene.add(flash);
                setTimeout(() => scene.remove(flash), 200);
            }
        }
    });
}

// Rotate coins
function updateCoins() {
    coins.forEach(coin => {
        if (!coin.collected) {
            coin.rotation.z += 0.02;
        }
    });
}

// Game loop
function animate() {
    requestAnimationFrame(animate);

    // Handle input
    if (keys.ArrowUp) {
        gameState.acceleration = gameState.accelerationRate;
    } else if (keys.ArrowDown) {
        gameState.acceleration = -gameState.accelerationRate;
    } else {
        gameState.acceleration = 0;
    }

    if (keys.ArrowLeft) {
        gameState.turning = gameState.turningRate;
    } else if (keys.ArrowRight) {
        gameState.turning = -gameState.turningRate;
    } else {
        gameState.turning = 0;
    }

    // Update physics
    gameState.speed += gameState.acceleration;
    gameState.speed *= gameState.friction;
    gameState.speed = Math.max(Math.min(gameState.speed, gameState.maxSpeed), -gameState.maxSpeed / 2);

    // Update car position and rotation
    car.rotation.y += gameState.turning * Math.sign(gameState.speed);
    const movement = new THREE.Vector3(
        Math.sin(car.rotation.y) * gameState.speed,
        0,
        Math.cos(car.rotation.y) * gameState.speed
    );
    car.position.add(movement);

    // Update coins
    updateCoins();
    checkCoinCollection();

    // Update score display
    scoreElement.textContent = `Score: ${gameState.score}`;

    // Camera updates
    const cameraDistance = 10;
    const cameraHeight = 5;
    const lookAtHeight = 2;
    
    const idealOffset = new THREE.Vector3(
        -Math.sin(car.rotation.y) * cameraDistance,
        cameraHeight,
        -Math.cos(car.rotation.y) * cameraDistance
    );
    
    camera.position.lerp(car.position.clone().add(idealOffset), 0.1);
    
    const lookAtPoint = car.position.clone();
    lookAtPoint.y += lookAtHeight;
    camera.lookAt(lookAtPoint);

    // Update speedometer
    const speedDisplay = Math.abs(Math.round(gameState.speed * 50));
    document.getElementById('speedometer').textContent = `Speed: ${speedDisplay} km/h`;

    // Update nitro particles
    updateNitroParticles();

    // Update nitro light
    if (gameState.nitroActive) {
        nitroLight.intensity = 2;
        nitroLight.position.copy(car.position).add(new THREE.Vector3(0, 1, 2));
    } else {
        nitroLight.intensity = 0;
    }

    // Update cooldown display
    if (gameState.nitroActive) {
        const timeLeft = 3 - Math.floor((Date.now() - gameState.nitroStartTime) / 1000);
        cooldownElement.textContent = `NITRO ACTIVE: ${timeLeft}s`;
        cooldownElement.style.color = '#ff4500';
    } else if (gameState.nitroCooldown) {
        const cooldownLeft = 30 - Math.floor((Date.now() - (gameState.nitroStartTime + 3000)) / 1000);
        cooldownElement.textContent = `Nitro Ready in: ${cooldownLeft}s`;
        cooldownElement.style.color = 'white';
    } else {
        cooldownElement.textContent = 'NITRO READY! [SPACE]';
        cooldownElement.style.color = '#00ff00';
    }

    // Send player updates to server
    sendPlayerUpdate();
    
    // Update other players
    updateOtherPlayers();

    renderer.render(scene, camera);
}

animate(); 