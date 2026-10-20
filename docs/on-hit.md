# On hit

Registers a handler that runs each time the sprite starts overlapping the collision target configured with the "detect collisions with" block. It fires once per overlap (rising edge), not every frame.

## Parameters

- **sprite**: the sprite to watch
- **handler**: the code to run on collision; receives the sprite and the target
