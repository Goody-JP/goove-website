// Keep previously shared page addresses useful after consolidation.
const destination = document.body.dataset.redirect;
if (destination && destination.startsWith('/') && !destination.startsWith('//')) location.replace(destination);
