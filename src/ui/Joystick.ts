import Phaser from 'phaser';

export interface JoystickInput {
  x: number; // -1 to 1
  y: number; // -1 to 1
  isActive: boolean;
}

export class Joystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Arc;
  private thumb: Phaser.GameObjects.Arc;
  private baseX: number;
  private baseY: number;
  private baseRadius: number = 50;
  private thumbRadius: number = 25;
  private maxDistance: number = 40;
  private isPressed: boolean = false;
  private pointerId: number = -1;

  public input: JoystickInput = { x: 0, y: 0, isActive: false };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;

    // Create joystick base (outer circle)
    this.base = scene.add.circle(x, y, this.baseRadius, 0x000000, 0.3);
    this.base.setStrokeStyle(2, 0xffffff, 0.5);
    this.base.setScrollFactor(0);
    this.base.setDepth(1000);

    // Create joystick thumb (inner circle)
    this.thumb = scene.add.circle(x, y, this.thumbRadius, 0xffffff, 0.5);
    this.thumb.setScrollFactor(0);
    this.thumb.setDepth(1001);

    // Set up input handlers
    this.setupInput();
  }

  private setupInput() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only capture if clicking on left side of screen (for joystick)
      if (pointer.x < this.scene.cameras.main.width / 2) {
        this.handlePointerDown(pointer);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPressed && pointer.id === this.pointerId) {
        this.handlePointerMove(pointer);
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.pointerId) {
        this.handlePointerUp();
      }
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    this.isPressed = true;
    this.pointerId = pointer.id;
    this.input.isActive = true;
    this.handlePointerMove(pointer);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    const dx = pointer.x - this.baseX;
    const dy = pointer.y - this.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const clampedDistance = Math.min(distance, this.maxDistance);
      const angle = Math.atan2(dy, dx);

      // Update thumb position
      this.thumb.x = this.baseX + Math.cos(angle) * clampedDistance;
      this.thumb.y = this.baseY + Math.sin(angle) * clampedDistance;

      // Update input values (-1 to 1)
      this.input.x = (Math.cos(angle) * clampedDistance) / this.maxDistance;
      this.input.y = (Math.sin(angle) * clampedDistance) / this.maxDistance;
    }
  }

  private handlePointerUp() {
    this.isPressed = false;
    this.pointerId = -1;
    this.input.isActive = false;
    this.input.x = 0;
    this.input.y = 0;

    // Reset thumb position
    this.thumb.x = this.baseX;
    this.thumb.y = this.baseY;
  }

  setVisible(visible: boolean) {
    this.base.setVisible(visible);
    this.thumb.setVisible(visible);
  }

  setPosition(x: number, y: number) {
    this.baseX = x;
    this.baseY = y;
    this.base.setPosition(x, y);
    if (!this.isPressed) {
      this.thumb.setPosition(x, y);
    }
  }

  destroy() {
    this.base.destroy();
    this.thumb.destroy();
  }
}
