var stats = {
    totalPlays : 0,
    playsByUser: {},
    totalSkips : 0,
    skipsByUser : {},
    skippedByUser : {}
};

module.exports.recordPlay = (track) => {
    stats.totalPlays += 1;
    if (!track.requested_by) return;
    if (!stats.playsByUser[track.requested_by]){
        stats.playsByUser[track.requested_by] = 0;
    }
    stats.playsByUser[track.requested_by] += 1;
}

module.exports.recordSkip = () => {
    stats.totalSkips += 1;

    if (!track.requested_by) return;
    if (!stats.skippedByUser[track.requested_by]){
        stats.skippedByUser[track.requested_by] = 0;
    }
    stats.skippedByUser[track.requested_by] += 1;

    if (!track.skipped_by) return;
    if (!stats.skipsByUser[track.skipped_by]){
        stats.skipsByUser[track.skipped_by] = 0;
    }
    stats.skipsByUser[track.skipped_by] += 1;
}

function getHighestValue(obj){
    var greatestValue = 0;
    var greatestKey = "";
    Object.keys(obj).forEach(key => {
        if (obj[key] <= greatestValue) return;
        greatestValue = obj[key];
        greatestKey = key;
    });
    if (greatestValue > 1) return [greatestKey, greatestValue];
    return null;
}

module.exports.getSummary = () => {
    const messages = [];
    messages.push(`${stats.totalPlays} songs played`);
    if (stats.totalSkips > 0){
        messages.push(`${stats.totalPlays} skipped`);
    }
    const biggestPlayer = getHighestValue(stats.playsByUser);
    if (biggestPlayer){
        messages.push(`:musical_note: ${biggestPlayer[0]} has played the most (${biggestPlayer[1]} played)`);
    }

    const biggestSkipper = getHighestValue(stats.skipsByUser);
    if (biggestSkipper){
        messages.push(`:fast_forward: ${biggestSkipper[0]} has skipped the most (${biggestSkipper[1]} skipped)`);
    }

    const biggestSkipped = getHighestValue(stats.skippedByUser);
    if (biggestSkipped){
        messages.push(`:fast_forward: ${biggestSkipper[0]} has had their choices skipped the most (${biggestSkipper[1]} skipped)`);
    }

    return messages.join('\n');
}