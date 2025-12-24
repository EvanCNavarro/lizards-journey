import Phaser from 'phaser';
import { BIRD } from '../config/constants';

export class Bird {
  private scene: Phaser.Scene;
  private shadowContainer: Phaser.GameObjects.Container;
  private shadowOuter: Phaser.GameObjects.Ellipse;
  private shadowInner: Phaser.GameObjects.Ellipse;
  private birdShape: Phaser.GameObjects.Graphics;
  private isAttacking: boolean = false;
  private attackTimer: number = 0;
  private cooldownTimer: number = 0;
  private currentCooldown: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private shadowSize: number = BIRD.minShadowSize;

  private onAttackCallback?: (x: number, y: number, radius: number) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Create shadow container
    this.shadowContainer = scene.add.container(0, 0);
    this.shadowContainer.setDepth(35);
    this.shadowContainer.setVisible(false);

    // Outer shadow (darker ring)
    this.shadowOuter = scene.add.ellipse(0, 0, BIRD.minShadowSize, BIRD.minShadowSize * 0.6, 0x000000, 0.3);
    this.shadowOuter.setStrokeStyle(3, 0x000000, 0.5);
    this.shadowContainer.add(this.shadowOuter);

    // Inner shadow (core)
    this.shadowInner = scene.add.ellipse(0, 0, BIRD.minShadowSize * 0.6, BIRD.minShadowSize * 0.4, 0x000000, 0.5);
    this.shadowContainer.add(this.shadowInner);

    // Bird silhouette shape
    this.birdShape = scene.add.graphics();
    this.drawBirdShape(BIRD.minShadowSize * 0.5);
    this.shadowContainer.add(this.birdShape);

    // Set initial cooldown
    this.resetCooldown();
  }

  private drawBirdShape(size: number) {
    this.birdShape.clear();
    this.birdShape.fillStyle(0x000000, 0.6);

    // Simple bird silhouette (body + wings)
    const wingSpan = size * 0.8;
    const bodyLength = size * 0.4;

    // Body (ellipse-ish)
    this.birdShape.fillEllipse(0, 0, bodyLength, bodyLength * 0.5);

    // Left wing
    this.birdShape.fillTriangle(
      -bodyLength * 0.3, 0,
      -wingSpan, -size * 0.15,
      -wingSpan * 0.5, size * 0.1
    );

    // Right wing
    this.birdShape.fillTriangle(
      bodyLength * 0.3, 0,
      wingSpan, -size * 0.15,
      wingSpan * 0.5, size * 0.1
    );

    // Head
    this.birdShape.fillCircle(0, -bodyLength * 0.3, bodyLength * 0.2);
  }

  onAttack(callback: (x: number, y: number, radius: number) => void) {
    this.onAttackCallback = callback;
  }

  update(delta: number, playerX: number, playerY: number, boundaryRadius: number, centerX: number, centerY: number) {
    if (this.isAttacking) {
      this.updateAttack(delta, playerX, playerY);
    } else {
      this.updateCooldown(delta, playerX, playerY, boundaryRadius, centerX, centerY);
    }
  }

  private updateCooldown(delta: number, playerX: number, playerY: number, boundaryRadius: number, centerX: number, centerY: number) {
    this.cooldownTimer += delta;

    if (this.cooldownTimer >= this.currentCooldown) {
      // Start new attack
      this.startAttack(playerX, playerY, boundaryRadius, centerX, centerY);
    }
  }

  private startAttack(playerX: number, playerY: number, boundaryRadius: number, centerX: number, centerY: number) {
    this.isAttacking = true;
    this.attackTimer = 0;
    this.shadowSize = BIRD.minShadowSize;

    // Position shadow near player but offset randomly
    const offsetAngle = Math.random() * Math.PI * 2;
    const offsetDistance = 50 + Math.random() * 50;
    this.targetX = playerX + Math.cos(offsetAngle) * offsetDistance;
    this.targetY = playerY + Math.sin(offsetAngle) * offsetDistance;

    // Clamp to island bounds
    const distFromCenter = Phaser.Math.Distance.Between(this.targetX, this.targetY, centerX, centerY);
    if (distFromCenter > boundaryRadius * 0.8) {
      const angle = Phaser.Math.Angle.Between(centerX, centerY, this.targetX, this.targetY);
      this.targetX = centerX + Math.cos(angle) * boundaryRadius * 0.8;
      this.targetY = centerY + Math.sin(angle) * boundaryRadius * 0.8;
    }

    this.shadowContainer.setPosition(this.targetX, this.targetY);
    this.shadowContainer.setVisible(true);
    this.shadowContainer.setAlpha(0.4);
    this.shadowContainer.setScale(0.3); // Start small
  }

  private updateAttack(delta: number, playerX: number, playerY: number) {
    this.attackTimer += delta;
    const progress = this.attackTimer / BIRD.attackDuration;

    if (progress >= 1) {
      // Attack complete - check for hit
      this.executeAttack();
      return;
    }

    // Grow shadow
    this.shadowSize = BIRD.minShadowSize + (BIRD.maxShadowSize - BIRD.minShadowSize) * progress;
    this.shadowOuter.setSize(this.shadowSize, this.shadowSize * 0.6);
    this.shadowInner.setSize(this.shadowSize * 0.6, this.shadowSize * 0.4);

    // Redraw bird shape at new size
    this.drawBirdShape(this.shadowSize * 0.5);

    // Increase opacity and scale
    const alpha = 0.4 + 0.5 * progress;
    const scale = 0.3 + 0.7 * progress;
    this.shadowContainer.setAlpha(alpha);
    this.shadowContainer.setScale(scale);

    // Track toward player slowly
    const trackSpeed = 0.5;
    this.targetX = Phaser.Math.Linear(this.targetX, playerX, trackSpeed * (delta / 1000));
    this.targetY = Phaser.Math.Linear(this.targetY, playerY, trackSpeed * (delta / 1000));
    this.shadowContainer.setPosition(this.targetX, this.targetY);
  }

  private executeAttack() {
    // Trigger attack callback
    if (this.onAttackCallback) {
      this.onAttackCallback(this.targetX, this.targetY, this.shadowSize / 2);
    }

    // Flash effect - quick swoop animation
    this.scene.tweens.add({
      targets: this.shadowContainer,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 0.3,
      duration: 150,
      onComplete: () => {
        this.shadowContainer.setVisible(false);
        this.shadowContainer.setScale(1);
      },
    });

    // Reset for next attack
    this.isAttacking = false;
    this.cooldownTimer = 0;
    this.resetCooldown();
  }

  private resetCooldown() {
    this.currentCooldown = Phaser.Math.Between(BIRD.cooldownMin, BIRD.cooldownMax);
  }

  isActive(): boolean {
    return this.isAttacking;
  }

  getShadowPosition(): { x: number; y: number; radius: number } {
    return {
      x: this.targetX,
      y: this.targetY,
      radius: this.shadowSize / 2,
    };
  }

  destroy() {
    this.shadowContainer.destroy();
  }
}
