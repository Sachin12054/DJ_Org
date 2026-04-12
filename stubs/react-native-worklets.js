// Stub for react-native-worklets
// Reanimated 4.x requires this package but it's only needed for native builds.
// On web, this stub prevents the Metro bundler error.
module.exports = {
  createSerializable: () => ({}),
  makeShareable: (v) => v,
  makeShareableCloneRecursive: (v) => v,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
};
