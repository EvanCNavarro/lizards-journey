import Phaser from 'phaser';
import { BIRD } from '../config/constants';

export class Bird {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private warningText: Phaser.GameObjects.Text;
  private birdEmoji: Phaser.GameObjects.Text;

  // Bird state
  private state: 'circling' | 'attacking' = 'circling';
  private attackTimer: number = 0;
  private cooldownTimer: number = 0;
  private currentCooldown: number = 0;

  // Shadow position and size
  private shadowX: number = 0;
  private shadowY: number = 0;
  private shadowSize: number = BIRD.minShadowSize;
  private targetSize: number = BIRD.minShadowSize;

  // Circling behavior
  private circleAngle: number = 0;
  private circleRadius: number = 100;
  private circleCenterX: number = 0;
  private circleCenterY: number = 0;

  private onAttackCallback?: (x: number, y: number, radius: number) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Create graphics for drawing shadow
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(25); // Below lizard but above grass

    // Warning text for attack - red background with white text
    this.warningText = scene.add.text(0, 0, ' ⚠️🦅 DANGER! ', {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#cc0000',
      padding: { x: 8, y: 4 },
    });
    this.warningText.setOrigin(0.5, 0.5);
    this.warningText.setDepth(101);
    this.warningText.setVisible(false);

    // Bird emoji that shows inside the shadow
    this.birdEmoji = scene.add.text(0, 0, '🦅', {
      fontSize: '20px',
    });
    this.birdEmoji.setOrigin(0.5, 0.5);
    this.birdEmoji.setDepth(26);
    this.birdEmoji.setAlpha(0.6);

    // Initial cooldown before first attack
    this.currentCooldown = Phaser.Math.Between(3000, 5000);
    this.circleAngle = Math.random() * Math.PI * 2;
  }

  onAttack(callback: (x: number, y: number, radius: number) => void) {
    this.onAttackCallback = callback;
  }

  update(delta: number, playerX: number, playerY: number, boundaryRadius: number, centerX: number, centerY: number) {
    // Update circle center to follow player loosely
    this.circleCenterX = Phaser.Math.Linear(this.circleCenterX, playerX, 0.02);
    this.circleCenterY = Phaser.Math.Linear(this.circleCenterY, playerY, 0.02);

    if (this.state === 'circling') {
      this.updateCircling(delta, playerX, playerY, boundaryRadius, centerX, centerY);
    } else {
      this.updateAttacking(delta, playerX, playerY);
    }

    // Always draw the shadow
    this.drawShadow();
  }

  private updateCircling(delta: number, playerX: number, playerY: number, boundaryRadius: number, centerX: number, centerY: number) {
    // Bird circles overhead
    this.circleAngle += delta * 0.001; // Slow rotation
    if (this.circleAngle > Math.PI * 2) {
      this.circleAngle -= Math.PI * 2;
    }

    // Calculate shadow position (circling around player area)
    this.shadowX = this.circleCenterX + Math.cos(this.circleAngle) * this.circleRadius;
    this.shadowY = this.circleCenterY + Math.sin(this.circleAngle) * this.circleRadius * 0.5; // Elliptical

    // Keep within island bounds
    const distFromCenter = Phaser.Math.Distance.Between(this.shadowX, this.shadowY, centerX, centerY);
    if (distFromCenter > boundaryRadius * 0.85) {
      const angle = Phaser.Math.Angle.Between(centerX, centerY, this.shadowX, this.shadowY);
      this.shadowX = centerX + Math.cos(angle) * boundaryRadius * 0.85;
      this.shadowY = centerY + Math.sin(angle) * boundaryRadius * 0.85;
    }

    // Shadow stays small while circling
    this.targetSize = BIRD.minShadowSize;
    this.shadowSize = Phaser.Math.Linear(this.shadowSize, this.targetSize, 0.1);

    // Check cooldown for next attack
    this.cooldownTimer += delta;
    if (this.cooldownTimer >= this.currentCooldown) {
      this.startAttack(playerX, playerY);
    }
  }

  private startAttack(_playerX: number, _playerY: number) {
    this.state = 'attacking';
    this.attackTimer = 0;

    // Show warning
    this.warningText.setVisible(true);
  }

  private updateAttacking(delta: number, playerX: number, playerY: number) {
    this.attackTimer += delta;
    const progress = this.attackTimer / BIRD.attackDuration;

    if (progress >= 1) {
      this.executeAttack();
      return;
    }

    // Shadow grows and moves toward player
    this.targetSize = BIRD.minShadowSize + (BIRD.maxShadowSize - BIRD.minShadowSize) * progress;
    this.shadowSize = Phaser.Math.Linear(this.shadowSize, this.targetSize, 0.15);

    // Track toward player more aggressively
    const trackSpeed = 1.5 + progress * 2; // Gets faster as attack progresses
    this.shadowX = Phaser.Math.Linear(this.shadowX, playerX, trackSpeed * (delta / 1000));
    this.shadowY = Phaser.Math.Linear(this.shadowY, playerY, trackSpeed * (delta / 1000));

    // Update warning position
    this.warningText.setPosition(this.shadowX, this.shadowY - this.shadowSize * 0.5 - 15);

    // Pulse warning text
    const pulse = Math.sin(this.attackTimer * 0.015) * 0.2 + 1;
    this.warningText.setScale(pulse);
  }

  private drawShadow() {
    this.graphics.clear();

    const isAttacking = this.state === 'attacking';
    const baseAlpha = isAttacking ? 0.5 : 0.3; // Reduced opacity

    // Outer glow (red-tinted when attacking)
    if (isAttacking) {
      this.graphics.fillStyle(0x660000, baseAlpha * 0.3);
      this.graphics.fillEllipse(this.shadowX, this.shadowY, this.shadowSize * 1.4, this.shadowSize * 0.9);

      // Red danger ring with white inner border for accessibility
      this.graphics.lineStyle(4, 0xffffff, baseAlpha * 0.8);
      this.graphics.strokeEllipse(this.shadowX, this.shadowY, this.shadowSize * 1.15, this.shadowSize * 0.72);
      this.graphics.lineStyle(3, 0xff0000, baseAlpha + 0.2);
      this.graphics.strokeEllipse(this.shadowX, this.shadowY, this.shadowSize * 1.2, this.shadowSize * 0.75);
    }

    // Main shadow ellipse
    this.graphics.fillStyle(0x000000, baseAlpha);
    this.graphics.fillEllipse(this.shadowX, this.shadowY, this.shadowSize, this.shadowSize * 0.6);

    // Update bird emoji position and scale
    this.birdEmoji.setPosition(this.shadowX, this.shadowY);
    const emojiScale = this.shadowSize / 40; // Scale based on shadow size
    this.birdEmoji.setScale(emojiScale);
    this.birdEmoji.setAlpha(isAttacking ? 0.8 : 0.5);
  }

  private executeAttack() {
    // Hide warning
    this.warningText.setVisible(false);

    // Trigger attack callback
    if (this.onAttackCallback) {
      this.onAttackCallback(this.shadowX, this.shadowY, this.shadowSize / 2);
    }

    // Flash effect
    const flash = this.scene.add.circle(this.shadowX, this.shadowY, this.shadowSize * 0.4, 0xff0000, 0.7);
    flash.setDepth(100);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 250,
      onComplete: () => flash.destroy(),
    });

    // Reset to circling
    this.state = 'circling';
    this.cooldownTimer = 0;
    this.currentCooldown = Phaser.Math.Between(BIRD.cooldownMin, BIRD.cooldownMax);

    // Jump shadow away after attack
    const escapeAngle = Math.random() * Math.PI * 2;
    this.shadowX += Math.cos(escapeAngle) * 80;
    this.shadowY += Math.sin(escapeAngle) * 40;
  }

  isActive(): boolean {
    return this.state === 'attacking';
  }

  getShadowPosition(): { x: number; y: number; radius: number } {
    return {
      x: this.shadowX,
      y: this.shadowY,
      radius: this.shadowSize / 2,
    };
  }

  destroy() {
    this.graphics.destroy();
    this.warningText.destroy();
    this.birdEmoji.destroy();
  }
}
