/**
 * @fileoverview Haptic feedback utilities for VibeConnect mobile app
 * @description Provides subtle haptic feedback for key user interactions
 *              - 0.3 sec buzz on NFT claim
 *              - Different patterns for rare/common actions
 *              - No visual popups, body-feel only
 *
 * @author VibeConnect Team
 */

import * as Haptics from 'expo-haptics';

/**
 * Standard claim haptic (0.3 seconds, medium impact)
 * Triggered when user claims an NFT
 * @returns {Promise<void>}
 */
export const claimHaptic = async (): Promise<void> => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Rare item haptic (holographic merch tier)
 * Laser swoosh feeling - sharp, quick, exciting
 * @returns {Promise<void>}
 */
export const rareHaptic = async (): Promise<void> => {
  try {
    // Quick succession of light impacts for "swoosh" effect
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 50);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 100);
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Common item haptic (base/glow merch tier)
 * Coin flip feeling - single medium bump
 * @returns {Promise<void>}
 */
export const commonHaptic = async (): Promise<void> => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Success haptic (transaction confirmed, NFT minted)
 * Double-tap confirmation feeling
 * @returns {Promise<void>}
 */
export const successHaptic = async (): Promise<void> => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Error haptic (transaction failed, network error)
 * Sharp warning feeling
 * @returns {Promise<void>}
 */
export const errorHaptic = async (): Promise<void> => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Selection haptic (button press, item select)
 * Subtle feedback for navigation
 * @returns {Promise<void>}
 */
export const selectionHaptic = async (): Promise<void> => {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Twin badge haptic (matching event NFT detected)
 * Special pattern: 2 quick pulses
 * @returns {Promise<void>}
 */
export const twinBadgeHaptic = async (): Promise<void> => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 150);
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Burn haptic (tokens burning, supply dropping)
 * Descending pattern
 * @returns {Promise<void>}
 */
export const burnHaptic = async (): Promise<void> => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 200);
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Check if haptics are supported on this device
 * @returns {Promise<boolean>} True if haptics are available
 */
export const isHapticsAvailable = async (): Promise<boolean> => {
  try {
    // Expo Haptics will throw if not available
    await Haptics.selectionAsync();
    return true;
  } catch {
    return false;
  }
};
