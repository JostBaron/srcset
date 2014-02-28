window.updateSrcSet = (function(window, document) {
    return function() {
        // Test if it already supports srcset
        if ('srcset' in document.createElement('img'))
            return true;

        // We want to get the device pixel ratio
        var windowWidth   = (window.innerWidth > 0) ? window.innerWidth : screen.width,
            windowHeight  = (window.innerHeight > 0) ? window.innerHeight : screen.height,
            deviceDensity = window.devicePixelRatio || 1;

        // Implement srcset
        function srcset(image) {
            if (!image.attributes['srcset']) return false;

            var candidates = image.attributes['srcset'].nodeValue.split(',');

            for (var i = 0; i < candidates.length; i++) {
                // The following regular expression was created based on the rules
                // in the srcset W3C specification available at:
                // http://www.w3.org/html/wg/drafts/srcset/w3c-srcset/

                var descriptors = candidates[i].match(
                        /^\s*([^\s]+)\s*(\s(\d+)w)?\s*(\s(\d+)h)?\s*(\s((\d+\.)?\d+)x)?\s*$/
                    ),
                    filename = descriptors[1],
                    width    = descriptors[3] || false,
                    height   = descriptors[5] || false,
                    density  = descriptors[7] || 1;

                if (width && width < windowWidth) {
                    continue;
                }

                if (height && height < windowHeight) {
                    continue;
                }

                if (density && density < deviceDensity) {
                    continue;
                }

                image.src = filename;
                return;
            }
        }


        var images = document.getElementsByTagName('img');

        for (var i=0; i < images.length; i++) {
            srcset(images[i]);
        }
    };
})(window, document);
