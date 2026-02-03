// This script prevents a common error caused by browser extensions
// that try to call a function that doesn't exist on the window object.
if (typeof (window as any)._autofillcallbackhandler !== 'function') {
  (window as any)._autofillcallbackhandler = function() {};
}
