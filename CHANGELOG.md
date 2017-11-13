# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Changed
### Added
### Fixed
### Removed

## [1.6.0] - 2017-11-11
### Changed
 - Replaced the taxon selection drop-downs in the 'full-details' (vis4) and 'side by side comparison' (vis3) visualisations with a completely new taxon selection control that much improves the user experience of these two tools. Taxa are selectable/de-selectable much more rapidly and individual taxa, even from long lists, can quickly be found with a filter feature. Updated tool user documentation to reflect this.
 - The load.js module has been reworked (along with changes in tombiovis.js) to facilitate dynamic loading of javascript and CSS files when they are needed. So, for example, a javascript file that is only required by a particular visualisation is not loaded until that visualisation is engaged. This is to keep the initial overhead of loading resources to a minimum.
 - The load.js module has been changed to look for minified javascript and CSS files and load them in preference to non-minified versions. (This behaviour can be overridden by a top level initialisation option in order to assist developers during debugging.) Again, this is to reduce the overhead of initial loading of resources.

### Added
 - Reinstated a new version of the 'full details' (vis4) visualisation (removed in release 1.5.0). This improved version has a more intelligent and responsive layout of the three elements: text, images and knowledge-base values. It also makes use of the new taxon selection control (see changed section).
 - Added new initialisation options to tombiovis so that people implementing the framework can easily control certain features from the calling web page, e.g. which tools are included and which is selected by default (previously this could only be done from the kb), and whether or not to show the visualisation selection drop-down. These new options are documented in the 'Deploying your visualisations' document. The 'Building a knowledge-base' document has also been updated to reflect the fact that kb 'config' options have been deprecated in favour of this new top-level method.
 - Added a new developer's API feature to tombiovis.js so that tool selection can be controlled from without the tombiovis.js module, e.g. by a hosting website. This API feature is documented in the 'Deploying your visualisations' document.
 - Added a new right-click context menu to all visualisations whereby users can generate a URL (automatically copied into buffer) that will take them to the same visualisation with the same options selected. This allows users to post URLs to social media etc that take people exactly to what they want to see, e.g. a certain image of a particular taxon.

## [1.5.0] - 2017-10-19
### Changed
 - Updated documentation for knowledge-base builders to make use of the new tooltip help features (see below) or disable them if required.
 - Updated documentation on deployment for knowledge-base builders.
 - Enlarged the default sizes of help and taxon information windows.
### Added
 - Added tooltips for input characters and character values. The tooltips display help text. This is a much more proactive way of displaying help rather than relying on users to click character names to invoke the help dialog.
 - Added taxon image tooltips. If an images is define for a taxon, then this appears in a tool-tip when the user moves the mouse over the taxon name for most visualisations.
 - Added context menu items to visualisations so that the user can disable the taxon image tooltip if required.
### Fixed
 - Reload drop-down option is supposed to reload the entire page without using the cache (for developers), but it was still using the cache in Chrome. This has been fixed.

## [1.4.1] - 2017-08-14
### Fixed
 - Applied fixes for issues #8 and #9.

## [1.4.0] - 2017-08-04
### Added
 - Added a new visualisation - circle pack key (vis5).
 - Added a new *taxon information* dialog box that combines the presentation of knowledge-base details, images and supplementary text (HTML files) for a taxon. This replaces the floating image control and knowledge-base information dialogs of previous versions.
 - Added the ability for knowledge-base builders to define ordinal ranges (e.g. [march-july]).
 - Added the ability to define and handle 'circular ordinals' e.g. months of the year where January and December must be considered adjacent - not at two ends of a range.
 - Added a section in *Building a Knowledge-base* documentation that explains how to encode taxonomy (as opposed to morphology) required for vis5 (and possible future visualisations).
 - Added new integrity checking for taxonomy in knowledge-base. This includes a new requirement for the 'Taxon' character to be specified with the group 'Taxonomy'.
 - In the test harness HTML page (vis.html) the title is now replaced with the name of the knowledge-base and the footer by the knowledge-base citation.
 - Knowledge-base builders now have the ability to specify a default character group to be selected where they are grouping characters (documented in *Building a knowledge-base* in the section on the config worksheet).
 - (Developers note) Added Javascript console messages to detail the order in which JS modules load to help with debugging in case of problems.
 - Updated *Deploying your visualisations* to indicate how a tool/visualisation can be selected by URL parameter.
### Fixed
 - Vertical orientation of character names in the two-column visualisation updated to make it work with Safari and IE.
 - Added better handling of the image control in mobile devices - especially iPad - by adding pinch zoom and explicit display/hiding of image controls with a press gesture.
 ### Changed
 - Individual character scores on the single-column key visualisation are now rounded *down* to the nearest 0.1 to avoid confusion of non-perfect matches apparently scoring a perfect match.
 - (Developers note) Moved definition of matching score colour ramp out of individual visualisations and into prototype visualisation module (visP). 
 - (Developers note) Moved knowledge-base integrity checks to a separate javascript module to promote code clarity.
### Removed
 - The 'Full details' visualisation (vis4) was made redundant (and has therefore been removed) by the addition of the new 'taxon details' dialog box that can be invoked from most of the other visualisations.

## [1.3.1] - 2017-02-22

### Fixed
 - Fixed 100% width problem with tools select drop-down menu.
 
## [1.3.0] - 2017-02-22

### Changed
 - Tool help is now displayed in-line rather than in dialog.
 - Invocation of tool help removed from button to drop-down option.
 - Reload button replaced by drop-down option.
 - Documentation to reflect a change to recommended method of running a local server from node.js to Google Chrome add-in (to facilitate more consistent installation/configuration across platforms).

### Added
 - Tool can now be selected by supplying 'selectedTool' param to URL of page, e.g. 'vis.html?selectedTool=vis2'.
 - Character values on taxa tab of knowledge base can now be commented out by using the hash character ('#').
 - visEarthworm (visualisation specific to earthworm knowledge-base) added to repository, but excluded from release.

### Fixed
 - Minor cosmetic changes to improve appearance.
 - Bug with vis2 (single column key) when a taxon name contained forward slash.

## [1.2.2] - 2017-01-18

### Added

- Added touch punch javascript library to improve performance on touch screen devices.
- Added an Excel version 97-2003 of the biscuits DB for people on older versions.

### Changed

- Migrated to latest release of D3 (4.4.0).
- Migrated to latest release of jQuery (3.1.1).
- Migrated to latest release of pqGrid (2.1.0).
- Migrated to latest release of pqSelect (1.3.2).

## Fixed

- Updated load.js to deal with problems with CSVs generated older versions of Excel.

## [1.2.1] - 2016-12-16

### Changed
- Updated version numbers on core software (in load.js) and 
for vis3.
- Small change to vis.html text.
- Updated template KB images to change case of all image extensions to
lower case to deal with hosts that are case sensitive.

## [1.2.0] - 2016-12-16

### Added
- Introduced this changelog and started to use semantic versioning.

### Changed
- Changed recommended, documented and configured local HTTP server 
configuration to use the Node.js package 'http-server'.

### Fixed
- Fixed bug with the 'Side by side comparison' visualisation (vis3.js)
that prevented correct sorting and ranking based on matching scores.

## [1.1] - 2016-11-29

### Added
- More detailed documentation.

## [1.0] - 2016-11-25

### Added
- Initial official release.