// xpCalculator.ts
/**
 * Calculate XP for completing a level
 * @param score Current score
 * @param level Current level completed
 * @param lives Remaining lives
 * @returns XP amount earned
 */
export const calculateLevelXp = (score: number, level: number, lives: number): number => {
    const baseXp = level * 100; // Base XP scales with level
    const scoreBonus = Math.floor(score / 10); // 1 XP per 10 points
    const livesBonus = lives * 25; // Bonus for remaining lives
    return baseXp + scoreBonus + livesBonus;
};

/**
 * Calculate XP when game ends (game over)
 * @param score Final score
 * @param level Highest level reached
 * @returns XP amount earned
 */
export const calculateGameOverXp = (score: number, level: number): number => {
    const baseXp = level * 50; // Smaller base for game over
    const scoreBonus = Math.floor(score / 20); // Less XP per point
    return baseXp + scoreBonus;
};

/**
 * Calculate total XP needed for a specific player level
 * @param playerLevel Target player level
 * @returns Total XP required
 */
export const calculateXpForLevel = (playerLevel: number): number => {
    // Exponential growth: level 1 = 100 XP, level 2 = 250 XP, level 3 = 450 XP, etc.
    return playerLevel * 150 + (playerLevel - 1) * 50;
};

/**
 * Calculate current player level based on total XP
 * @param totalXp Total XP earned
 * @returns Current player level and progress to next level
 */
export const calculatePlayerLevel = (totalXp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progress: number } => {
    let level = 1;
    let xpForCurrentLevel = 0;
    let xpForNextLevel = calculateXpForLevel(level + 1);
    
    while (totalXp >= xpForNextLevel) {
        level++;
        xpForCurrentLevel = xpForNextLevel;
        xpForNextLevel = calculateXpForLevel(level + 1);
    }
    
    const currentLevelXp = totalXp - xpForCurrentLevel;
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
    const progress = currentLevelXp / xpNeededForNext;
    
    return {
        level,
        currentLevelXp,
        nextLevelXp: xpNeededForNext,
        progress: Math.min(progress, 1) // Cap at 100%
    };
};

/**
 * Visual effect helper for XP gain notifications
 * @param amount XP amount gained
 * @param containerId Container element ID for the notification
 */
export const showXpGain = (amount: number, containerId: string = 'xp-notification-container'): void => {
    const xpGainElement = document.createElement('div');
    xpGainElement.className = 'xp-gain-popup';
    xpGainElement.textContent = `+${amount} XP`;
    xpGainElement.style.position = 'absolute';
    xpGainElement.style.color = '#22c55e';
    xpGainElement.style.fontWeight = 'bold';
    xpGainElement.style.fontSize = '18px';
    xpGainElement.style.textShadow = '0 0 10px #22c55e';
    xpGainElement.style.animation = 'floatUp 1.5s ease-out forwards';
    xpGainElement.style.pointerEvents = 'none';
    xpGainElement.style.zIndex = '1000';
    
    // Add CSS animation if it doesn't exist
    if (!document.querySelector('#xp-float-animation')) {
        const style = document.createElement('style');
        style.id = 'xp-float-animation';
        style.textContent = `
            @keyframes floatUp {
                0% {
                    opacity: 1;
                    transform: translateY(0px) scale(1);
                }
                50% {
                    transform: translateY(-20px) scale(1.1);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-40px) scale(0.8);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    const container = document.getElementById(containerId);
    if (container) {
        container.appendChild(xpGainElement);
        
        // Remove after animation
        setTimeout(() => {
            if (xpGainElement.parentNode) {
                xpGainElement.parentNode.removeChild(xpGainElement);
            }
        }, 1500);
    } else {
        console.warn(`XP notification container '${containerId}' not found`);
    }
};