import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export interface ModalButton {
  text: string;
  callback: () => void;
  primary?: boolean;
}

export interface ModalConfig {
  title: string;
  content: string[];
  buttons: ModalButton[];
}

export class Modal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Rectangle;
  private isVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.container.setDepth(2000);
    this.container.setScrollFactor(0);

    // Dark overlay
    this.overlay = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    this.overlay.setDepth(1999);
    this.overlay.setScrollFactor(0);
    this.overlay.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.hide();
  }

  show(config: ModalConfig) {
    // Clear previous content
    this.container.removeAll(true);

    const modalWidth = 320;
    const padding = 20;

    // Calculate height based on content
    const lineHeight = 24;
    const titleHeight = 40;
    const contentHeight = config.content.length * lineHeight;
    const buttonHeight = 50;
    const modalHeight = titleHeight + contentHeight + buttonHeight + padding * 3;

    // Modal background
    const bg = this.scene.add.rectangle(0, 0, modalWidth, modalHeight, 0x2a2a4a, 1);
    bg.setStrokeStyle(3, 0x4a4a6a);
    this.container.add(bg);

    // Title
    const title = this.scene.add.text(0, -modalHeight / 2 + padding + 10, config.title, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    title.setOrigin(0.5, 0);
    this.container.add(title);

    // Content lines
    let yOffset = -modalHeight / 2 + titleHeight + padding * 1.5;
    config.content.forEach((line) => {
      const text = this.scene.add.text(0, yOffset, line, {
        fontSize: '16px',
        color: '#cccccc',
      });
      text.setOrigin(0.5, 0);
      this.container.add(text);
      yOffset += lineHeight;
    });

    // Buttons
    const buttonY = modalHeight / 2 - buttonHeight / 2 - padding;
    const buttonWidth = (modalWidth - padding * 3) / config.buttons.length;

    config.buttons.forEach((btnConfig, index) => {
      const btnX = -modalWidth / 2 + padding + buttonWidth / 2 + index * (buttonWidth + padding);

      const btnBg = this.scene.add.rectangle(
        btnX,
        buttonY,
        buttonWidth - 10,
        35,
        btnConfig.primary ? 0x4ca64c : 0x555555
      );
      btnBg.setStrokeStyle(2, btnConfig.primary ? 0x6cc66c : 0x777777);
      btnBg.setInteractive({ useHandCursor: true });

      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(btnConfig.primary ? 0x6cc66c : 0x777777);
      });
      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(btnConfig.primary ? 0x4ca64c : 0x555555);
      });
      btnBg.on('pointerdown', () => {
        this.hide();
        btnConfig.callback();
      });

      const btnText = this.scene.add.text(btnX, buttonY, btnConfig.text, {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      });
      btnText.setOrigin(0.5, 0.5);

      this.container.add(btnBg);
      this.container.add(btnText);
    });

    this.overlay.setVisible(true);
    this.container.setVisible(true);
    this.isVisible = true;
  }

  hide() {
    this.overlay.setVisible(false);
    this.container.setVisible(false);
    this.isVisible = false;
  }

  getIsVisible(): boolean {
    return this.isVisible;
  }

  destroy() {
    this.container.destroy();
    this.overlay.destroy();
  }
}
