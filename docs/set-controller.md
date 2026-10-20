# Set controller

Sets the controller that controls this sprite. When enabled, the directional buttons of the controller set the facing direction of the sprite instead of the velocity and position changes.

Button predicates (`button A pressed`, `action button just pressed`, etc.) are also read from this controller. If none is specified, player 1's controller is used.

## Parameters

- **sprite**: the sprite to set the controller for
- **enabled**: `true` if this sprite is controlled by a controller
- **controller**: the controller that controls this sprite (optional, defaults to player 1)
