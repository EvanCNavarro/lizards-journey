import Phaser from 'phaser';
import { BIRD } from '../config/constants';

export class Bird {
  private scene: Phaser.Scene;
  private shadow: Phaser.GameObjects.Ellipse;
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

    // Create shadow ellipse
    this.shadow = scene.add.ellipse(0, 0, BIRD.minShadowSize, BIRD.minShadowSize * 0.6, 0x000000, 0);
    this.shadow.setDepth(30);
    this.shadow.setVisible(false);

    // Set initial cooldown
    this.resetCooldown();
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

    this.shadow.setPosition(this.targetX, this.targetY);
    this.shadow.setVisible(true);
    this.shadow.setAlpha(0.2);
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
    this.shadow.setSize(this.shadowSize, this.shadowSize * 0.6);

    // Increase opacity
    const alpha = 0.2 + 0.5 * progress;
    this.shadow.setAlpha(alpha);

    // Track toward player slowly
    const trackSpeed = 0.3;
    this.targetX = Phaser.Math.Linear(this.targetX, playerX, trackSpeed * (delta / 1000));
    this.targetY = Phaser.Math.Linear(this.targetY, playerY, trackSpeed * (delta / 1000));
    this.shadow.setPosition(this.targetX, this.targetY);
  }

  private executeAttack() {
    // Trigger attack callback
    if (this.onAttackCallback) {
      this.onAttackCallback(this.targetX, this.targetY, this.shadowSize / 2);
    }

    // Flash effect
    this.scene.tweens.add({
      targets: this.shadow,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.shadow.setVisible(false);
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
    this.shadow.destroy();
  }
}
