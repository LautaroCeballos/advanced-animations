# Set overlap target

Enables the `hitting a sprite` predicate while the sprite overlaps the target. A rising-edge event is also fired for the "on hit" block each time the overlap begins.

Call the block again with no target (or pass nothing) to stop detecting collisions. Tile collisions (`hitting wall up/right/down/left`) do not need this block.

## Parameters

- **sprite**: the sprite to track collisions for
- **target**: the sprite this sprite should be checked against (optional; omit to clear)
