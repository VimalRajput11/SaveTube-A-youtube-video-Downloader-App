export const formatDuration = (seconds) => {
    if (!seconds) return null;

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const formattedM = m < 10 && h > 0 ? `0${m}` : m;
    const formattedS = s < 10 ? `0${s}` : s;

    if (h > 0) return `${h}:${formattedM}:${formattedS}`;
    return `${formattedM}:${formattedS}`;
};
