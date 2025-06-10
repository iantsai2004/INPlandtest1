const states = new Map();
function getState(userId) {
    return states.get(userId) || {};
}
function setState(userId, data) {
    states.set(userId, data);
}
function clearState(userId) {
    states.delete(userId);
}

module.exports = { getState, setState, clearState };