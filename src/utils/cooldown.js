const cooldowns = new Map();

const cooldown = async (userId, duration, func, Neko, M) => {
  try {
    const currentTime = Date.now();
    const checkCooldown = () => {
      if (cooldowns.has(userId)) {
        const cooldownEnd = cooldowns.get(userId);
        if (cooldownEnd > currentTime) {
          const remainingTime = Math.ceil((cooldownEnd - currentTime) / 1000);
          Neko.sendReactMessage(M.from, "♥️", M);
          Neko.sendTextMessage(
            M.from,
            `You are on cooldown. Please wait ${remainingTime} seconds before using this command again.`,
            M,
          );
          return false;
        }
      }
      return true;
    };

    if (checkCooldown()) {
      await func(Neko, M);
      cooldowns.set(userId, currentTime + duration);
      setTimeout(() => {
        cooldowns.delete(userId);
      }, duration);
    }
  } catch (error) {
    throw new Error(error);
  }
};

export default cooldown;
