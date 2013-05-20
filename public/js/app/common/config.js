/**
 * UI-level configuration parameters
 *
 * TODO: find a way to merge this with the server-side configuration file, so that we don't have
 * to maintain two different configurtaion files
 */
define(function() {
    return({
        yam: {
            // expand images that are embedded in yams; otherwise show the thumbnail
            expand_images: true
        }
    });
});