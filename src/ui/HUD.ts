import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';

export class HUD {
  private container: Phaser.GameObjects.Container;

  private timerText: Phaser.GameObjects.Text;
  private bugCountText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;

  private timeRemaining: number = 0;
  private bugsCollected: number = 0;
  private bugsTarget: number = 0;
  private score: number = 0;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);
    this.container.setScrollFactor(0);

    // Background bar
    const bgBar = scene.add.rectangle(GAME_WIDTH / 2, 25, GAME_WIDTH - 20, 40, 0x000000, 0.5);
    bgBar.setStrokeStyle(2, 0x333333);
    this.container.add(bgBar);

    // Bug count (left)
    this.bugCountText = scene.add.text(20, 25, 'Bugs: 0/10', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    this.bugCountText.setOrigin(0, 0.5);
    this.container.add(this.bugCountText);

    // Timer (center)
    this.timerText = scene.add.text(GAME_WIDTH / 2, 25, '1:00', {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    this.timerText.setOrigin(0.5, 0.5);
    this.container.add(this.timerText);

    // Score (right)
    this.scoreText = scene.add.text(GAME_WIDTH - 20, 25, 'Score: 0', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(1, 0.5);
    this.container.add(this.scoreText);
  }

  setTarget(target: number) {
    this.bugsTarget = target;
    this.updateBugCount();
  }

  setTime(seconds: number) {
    this.timeRemaining = seconds;
    this.updateTimer();
  }

  updateTimer() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = Math.floor(this.timeRemaining % 60);
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    this.timerText.setText(display);

    // Change color when time is low
    if (this.timeRemaining <= 10) {
      this.timerText.setColor('#ff4444');
    } else if (this.timeRemaining <= 20) {
      this.timerText.setColor('#ffaa00');
    } else {
      this.timerText.setColor('#ffffff');
    }
  }

  addBug(points: number) {
    this.bugsCollected++;
    this.score += points;
    this.updateBugCount();
    this.updateScore();
  }

  private updateBugCount() {
    this.bugCountText.setText(`Bugs: ${this.bugsCollected}/${this.bugsTarget}`);

    // Change color based on progress
    if (this.bugsCollected >= this.bugsTarget) {
      this.bugCountText.setColor('#44ff44');
    } else {
      this.bugCountText.setColor('#ffffff');
    }
  }

  private updateScore() {
    this.scoreText.setText(`Score: ${this.score}`);
  }

  getBugsCollected(): number {
    return this.bugsCollected;
  }

  getScore(): number {
    return this.score;
  }

  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  reset() {
    this.timeRemaining = 0;
    this.bugsCollected = 0;
    this.score = 0;
    this.updateTimer();
    this.updateBugCount();
    this.updateScore();
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.container.destroy();
  }
}
