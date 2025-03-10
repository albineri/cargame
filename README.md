# Three.js Racing Game with Multiplayer

A 3D racing game built with Three.js featuring multiplayer functionality!

## Features

- 3D racing game with smooth controls
- Professional race track with varied corners
- Collectible coins for points
- Nitro boost powerup (press SPACE)
- Multiplayer racing with other players

## Controls

- **Arrow Up**: Accelerate
- **Arrow Down**: Brake/Reverse
- **Arrow Left/Right**: Steer
- **Space**: Activate Nitro Boost (3-second boost with 30-second cooldown)

## Multiplayer Setup

The game uses WebSockets for multiplayer functionality. By default, it connects to an echo server which allows you to see other players who are also connected to the same server.

### Connection Options

1. **Echo Server**: The default option (wss://demos.kaazing.com/echo) will reflect your position back to you and to anyone else connected to the same server. This is useful for testing.

2. **Custom WebSocket Server**: For a proper multiplayer experience, you can set up a simple WebSocket server and enter its URL in the connection dialog.

### How Multiplayer Works

- When you start the game, you'll see a connection dialog
- Enter your player name and select/enter a WebSocket server URL
- Click "Connect" to join the multiplayer session
- You'll see other connected players with their cars on the track
- Each player has a unique color
- Player list shows who is currently connected
- Nitro effects are visible on other players' cars

## Performance Notes

- The game uses optimized player position updates (10 per second)
- Players who disconnect or lose connection are automatically removed after 10 seconds
- For best performance, limit the number of simultaneous players to around 10-20

## Setting Up Your Own Server

For a proper multiplayer experience, you can set up a simple WebSocket server. There are many options available:

1. **Node.js WebSocket Server**: A simple Node.js server using the 'ws' package
2. **Python WebSocket Server**: Using libraries like 'websockets' 
3. **Cloud Options**: Services like Heroku, Glitch, or Replit can host WebSocket servers

A basic server only needs to receive messages from clients and broadcast them to all other connected clients.

Enjoy racing! 