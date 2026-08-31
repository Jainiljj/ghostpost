// Calculate distance using Haversine formula
const getDistanceInMeters = (coords1, coords2) => {
  if (!coords1 || !coords2 || coords1.length !== 2 || coords2.length !== 2) {
    return null;
  }

  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371000; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getDistanceLabel = (postLocation, userCoords) => {
  if (!postLocation || !postLocation.coordinates || !userCoords) {
    return 'Global';
  }

  const distance = getDistanceInMeters(postLocation.coordinates, userCoords);
  if (distance === null) return 'Global';

  if (distance <= 100) return 'Just here';
  if (distance <= 1000) return 'Within 1 km';
  if (distance <= 5000) return 'Within 5 km';
  if (distance <= 10000) return 'Within 10 km';
  if (distance <= 25000) return 'Within 25 km';
  return 'Far away';
};

// Formats a post for API output:
// - Strips raw coordinates (privacy)
// - Injects distanceLabel, hasLocation, userVote, isBookmarked
const maskPost = (post, userCoords = null, userVotesMap = {}, bookmarkSet = new Set()) => {
  const postObj = post.toObject ? post.toObject() : { ...post };

  postObj.distanceLabel = getDistanceLabel(postObj.location, userCoords);
  postObj.hasLocation = !!(postObj.location && postObj.location.coordinates);

  // Delete precise coordinates for privacy
  delete postObj.location;

  postObj.userVote = userVotesMap[postObj._id.toString()] || 0;
  postObj.isBookmarked = bookmarkSet instanceof Set
    ? bookmarkSet.has(postObj._id.toString())
    : false;

  return postObj;
};

module.exports = {
  getDistanceInMeters,
  getDistanceLabel,
  maskPost,
};
