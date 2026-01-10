/**
 * @fileoverview Sound effect utilities for VibeConnect mobile app
 * @description Provides audio feedback for key user interactions
 *              - Coin flip sound for base merch tier
 *              - Laser swoosh sound for holographic tier
 *              - No popup text, audio-only feedback
 *
 * @author VibeConnect Team
 */

import { Audio } from 'expo-av';

// Sound instances (loaded once, reused)
let coinFlipSound: Audio.Sound | null = null;
let laserSwooshSound: Audio.Sound | null = null;
let successSound: Audio.Sound | null = null;
let burnSound: Audio.Sound | null = null;

/**
 * Initialize all sound effects
 * Call this on app startup to pre-load sounds
 * @returns {Promise<void>}
 */
export const initializeSounds = async (): Promise<void> => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Load coin flip sound
    const { sound: coin } = await Audio.Sound.createAsync(
      require('../../assets/sounds/coin-flip.mp3'),
      { shouldPlay: false }
    );
    coinFlipSound = coin;

    // Load laser swoosh sound
    const { sound: laser } = await Audio.Sound.createAsync(
      require('../../assets/sounds/laser-swoosh.mp3'),
      { shouldPlay: false }
    );
    laserSwooshSound = laser;

    // Load success sound
    const { sound: success } = await Audio.Sound.createAsync(
      require('../../assets/sounds/success.mp3'),
      { shouldPlay: false }
    );
    successSound = success;

    // Load burn sound
    const { sound: burn } = await Audio.Sound.createAsync(require('../../assets/sounds/burn.mp3'), {
      shouldPlay: false,
    });
    burnSound = burn;

    console.log('✅ Sounds initialized');
  } catch (error) {
    console.warn('Failed to initialize sounds:', error);
  }
};

/**
 * Play coin flip sound (base/glow merch tier)
 * Subtle metallic clink
 * @returns {Promise<void>}
 */
export const playCoinFlip = async (): Promise<void> => {
  try {
    if (!coinFlipSound) {
      await initializeSounds();
    }
    await coinFlipSound?.replayAsync();
  } catch (error) {
    console.warn('Failed to play coin flip sound:', error);
  }
};

/**
 * Play laser swoosh sound (holographic merch tier)
 * Futuristic whoosh
 * @returns {Promise<void>}
 */
export const playLaserSwoosh = async (): Promise<void> => {
  try {
    if (!laserSwooshSound) {
      await initializeSounds();
    }
    await laserSwooshSound?.replayAsync();
  } catch (error) {
    console.warn('Failed to play laser swoosh sound:', error);
  }
};

/**
 * Play success sound (NFT minted, transaction confirmed)
 * Cheerful ding
 * @returns {Promise<void>}
 */
export const playSuccess = async (): Promise<void> => {
  try {
    if (!successSound) {
      await initializeSounds();
    }
    await successSound?.replayAsync();
  } catch (error) {
    console.warn('Failed to play success sound:', error);
  }
};

/**
 * Play burn sound (tokens burning)
 * Descending whoosh
 * @returns {Promise<void>}
 */
export const playBurn = async (): Promise<void> => {
  try {
    if (!burnSound) {
      await initializeSounds();
    }
    await burnSound?.replayAsync();
  } catch (error) {
    console.warn('Failed to play burn sound:', error);
  }
};

/**
 * Cleanup all sound instances
 * Call this when app is being closed
 * @returns {Promise<void>}
 */
export const cleanupSounds = async (): Promise<void> => {
  try {
    await coinFlipSound?.unloadAsync();
    await laserSwooshSound?.unloadAsync();
    await successSound?.unloadAsync();
    await burnSound?.unloadAsync();

    coinFlipSound = null;
    laserSwooshSound = null;
    successSound = null;
    burnSound = null;

    console.log('✅ Sounds cleaned up');
  } catch (error) {
    console.warn('Failed to cleanup sounds:', error);
  }
};

/**
 * Mute all sounds (user preference)
 * @returns {Promise<void>}
 */
export const muteSounds = async (): Promise<void> => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
    });
  } catch (error) {
    console.warn('Failed to mute sounds:', error);
  }
};

/**
 * Unmute all sounds (user preference)
 * @returns {Promise<void>}
 */
export const unmuteSounds = async (): Promise<void> => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch (error) {
    console.warn('Failed to unmute sounds:', error);
  }
};
