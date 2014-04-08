window.updateSrcSet = (function(window, document) {
    // Test if it already supports srcset
    if ('srcset' in document.createElement('img')) {
        return function() {};
    }
    else {
        return function() {

            var images = document.getElementsByTagName('img');

            for (var i=0; i < images.length; i++) {
                srcset(images[i]);
            }

            function srcset(image) {
                var srcsetAttributeValue = 'srcset' in image.attributes ? image.attributes['srcset'].nodeValue : '';
                var srcAttributeValue = 'src' in image.attributes ? image.attributes['src'].nodeValue : '';
                
                var candidates = parseCandidates(srcsetAttributeValue, srcAttributeValue);

                image.src = getMatchingCandidate(candidates);
            }

            function parseCandidates(srcsetAttributeValue, srcAttributeValue) {
                var candidates = [];
                var parsedCandidates = [];

                if ('string' === typeof(srcsetAttributeValue)) {
                    candidates = srcsetAttributeValue.split(',');
                }

                // Add the original src to the candidate list
                if ('string' === typeof(srcAttributeValue)) {
                    parsedCandidates.push({
                        url:        srcAttributeValue,
                        width:      Number.POSITIVE_INFINITY,
                        height:     Number.POSITIVE_INFINITY,
                        density:    Number.POSITIVE_INFINITY
                    });
                }

                for (var i = 0; i < candidates.length; i++) {
                    // The following regular expression was created based on the rules
                    // in the srcset W3C specification available at:
                    // http://www.w3.org/html/wg/drafts/srcset/w3c-srcset/
                    var descriptors = candidates[i].match(
                            /^\s*([^\s]+)\s*(\s(\d+)w)?\s*(\s(\d+)h)?\s*(\s((\d+\.)?\d+)x)?\s*$/
                    );

                    // The candidate match not the regular expression, so skip it
                    if (null === descriptors) {
                        continue;
                    }

                    var filename = descriptors[1];
                    var width    = parseInt(descriptors[3]);
                    var height   = parseInt(descriptors[5]);
                    var density  = parseFloat(descriptors[7]);

                    width = isNaN(width) ? Number.POSITIVE_INFINITY : width;
                    height = isNaN(height) ? Number.POSITIVE_INFINITY : height;
                    density = isNaN(density) ? 1.0 : density;

                    parsedCandidates.push({
                        url:        filename,
                        width:      width,
                        height:     height,
                        density:    density
                    });
                }

                return parsedCandidates;
            }

            // Selects a candidate from the list of given candidates. First
            // eliminates all candidates with too small width, height or
            // density.
            // Then filters the remaining candidates so only the ones with
            // minimal width remain. These are filtered so the ones with minimal
            // height remain, and the remainder is again filtered so only the
            // one candidate with minimal density remains. The only reason
            // multiple candidates could remain is when two candidates were
            // given for the same (widht, height, density) tuple.
            function getMatchingCandidate(candidates) {

                // Get the actual values of the device
                var windowWidth   = (window.innerWidth > 0) ? window.innerWidth : screen.width;
                var windowHeight  = (window.innerHeight > 0) ? window.innerHeight : screen.height;
                var deviceDensity = window.devicePixelRatio || 1.0;

                // Filter out candidates that are not matching at all
                var matchingCandidates = candidates.filter(function(candidate) {
                    return candidate.width >= windowWidth
                        && candidate.height >= windowHeight
                        && candidate.density >= deviceDensity;
                });

                function removeAllWithNonMinimalProperty(array, property) {
                    var minimalValue = Number.POSITIVE_INFINITY;

                    for (var i = 0; i < array.length; i++) {
                        var currentObject = array[i];
                        minimalValue = Math.min(minimalValue, (property in currentObject) ? currentObject[property] : Number.POSITIVE_INFINITY);
                    }

                    return array.filter(function(object) {
                        if (!(property in object)) {
                            return false;
                        }

                        return object[property] <= minimalValue;
                    });
                };

                matchingCandidates = removeAllWithNonMinimalProperty(matchingCandidates, 'width');
                matchingCandidates = removeAllWithNonMinimalProperty(matchingCandidates, 'height');
                matchingCandidates = removeAllWithNonMinimalProperty(matchingCandidates, 'density');

                if (1 < matchingCandidates.length) {
                    console.error('Something went wrong, there are too many candidates for a URL. Are there two candidates with the same values?');
                }

                if (0 === matchingCandidates.length) {
                    return ''; // A hopefully sensible default, not showing any image.
                }
                else {
                    return matchingCandidates[0].url;
                }
            }
        };
    };
})(window, document);
