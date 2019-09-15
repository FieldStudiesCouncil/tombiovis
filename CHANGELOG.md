# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

<!-- ## [Unreleased] -->
## [1.9.0] - 2019-09-15
### Added
 - Deals intelligently with missing data. The Identikit is now much more robust in how
 it deals with missing data. In fact it will now operate with only a taxa.csv file. This
 makes it much easier to learn how to use the Identikit 
 [issue 61](https://github.com/FieldStudiesCouncil/tombiovis/issues/61).
### Fixed
The following bugs evident in version 1.9-alpha were fixed:

 - [Issue 77](https://github.com/FieldStudiesCouncil/tombiovis/issues/77).
 - [Issue 65](https://github.com/FieldStudiesCouncil/tombiovis/issues/65).

The following bugs evident in version 1.8.1 were fixed:
 - [Issue 66](https://github.com/FieldStudiesCouncil/tombiovis/issues/66).
 - [Issue 61](https://github.com/FieldStudiesCouncil/tombiovis/issues/61).
 - [Issue 60](https://github.com/FieldStudiesCouncil/tombiovis/issues/60).
 - [Issue 57](https://github.com/FieldStudiesCouncil/tombiovis/issues/57).
 - [Issue 53](https://github.com/FieldStudiesCouncil/tombiovis/issues/53).
 - [Issue 52](https://github.com/FieldStudiesCouncil/tombiovis/issues/52).
 - [Issue 49](https://github.com/FieldStudiesCouncil/tombiovis/issues/49).
 - [Issue 48](https://github.com/FieldStudiesCouncil/tombiovis/issues/48).
 - [Issue 47](https://github.com/FieldStudiesCouncil/tombiovis/issues/47).
### Changed
 - Updated .gitignore and .gitattributes to prevent unecessary files from gulp minifying workflow being deployed to Git or included in the releases.
## [1.8.2] - 2018-11-14
### Changed
 - Set the pwaSupress flag to true in vism.html to prevent service worker kicking in during KB development (and causing confusing caching issues).
 - Removed CSS from vis.html and vism.html and put into site.css. This file can then be used by people deploying using a page based on vis.html to add CSS to their sites. The CSS in site.css to alter margins is not appropriate for some CMS deployments.
## [1.8.1] - 2018-10-25
### Changed
 - Removed uneeded file (test.zip) from release package.
 - Updated changelog and release notes to reflect missing 1.7.2 notes.
## [1.8.0] - 2018-10-24
### Added
 - Added PWA capability including app manifest ('manifest.json') and service worker ('sw.js') to enable depolyment of Identikit resources as mobile apps capable of being used away from the internet.
 - Added a new visualisation ('vis6') which is a mobile-first multi-access key capable of using the PWA features to download resources for offline use.
 - Updated documentation, especially 'Deploying your visualisations' and 'Getting started', to explain how to deploy PWA Identikit apps with vis6.
 - Added a configuration option (tbv.opts.ignoreNegativeScoring) to instruct Identikit to ignore negative scores (issue 26). Documented in 'Deploying your visualisations'.
 - Added a facility for knowledge-base developers to provide a downloadable PDF to describe their resource. If a file called 'info.pdf' is found in the knowledge-base folder, a download link is added to the main tool interface (issue #21).
 - Added a mechanism for checking APIs of objects against template interfaces.
### Fixed
 - Addressed typo is KB checking (issue #22).
 - Addressed issue whereby clearing value in spin control (character input) with keyboard, but software treated value as zero rather than null (issue #24).
### Changed
 - Implemented architectural changes to separate three levels of interface: overarching GUI, visualisations and user-input GUIs.
 - Moved visualisation-specific CSS out of general CSS file (tombio.css) and into separate CSS files for individual tools.
 - Multiple spaces in kb values (or translated values) caused problem. These are now removed as the KB is loaded (issue #25).
 - Improved layout of images and their captions on help dialogs (issue #31).
 - Updated D3 to version 5 (issue #32).
 - Changed and added a number of top-level configuration options (documented in 'Deploying your visualisations').
### Removed
 - Citation of individual tools removed (issue #29).

## [1.7.2] - 2018-07-05
### Fixed
 - Bugfix for issue #19.

## [1.7.1] - 2018-06-11
### Fixed
 - Addressed problem with 'close' and 'full-size' image controls not working in the side-by-side comparison tool when galleria image small.
 - Updated tool help to reflect new image control.
## [1.7.0] - 2018-06-07
### Changed
 - Rebranded as *FSC Identikit* (replaces *Tom.Bio ID Framework* and similar).
 - Changed structure of code from using a 'classes' pattern to conform to the simpler OLOO pattern of Kyle  Simpson. This includes all the visualisation objects and the stateValue object.
 - Replaced the variable named *core* with *tbv* which relates better to the top-level *tombiovis* object that it represents.
 - Changed advice for creating HTML documents (in *Building a knowledge-base document*) - partly to overcome handling character encoding problems of 'special characters'.
 - Changed KB template macro for generating CSV files to create them with character encoding of UTF-8 to help overcome handling 'special characters' in knowledge bases.
 - Changed image handling control to *Galleria* image control to give a better user-experience and overcome some problems with previous image handling (e.g. https://github.com/burkmarr/tombiovis/issues/15 and https://github.com/burkmarr/tombiovis/issues/16.)
 - Changed handling of state storage to be consistent across visualisations.
 - Now standardising on ES6 rather than ES5 - starting to use promises for async processing.
 - In line with the above, the 'test harness' vile *vis.html* now includes a reference to a polyfil for ES6 to account for users with older browsers.
 - Changed scoring so that the special *Sex* character no longer scores.
 - Changed from *Strictness* to *Latitude* in kowledge-base. Support for *Strictness* is still included, but is deprecated. *Latitude* allows for much more predictable results from the point of view of KB developers.
 - Changed default sorting order of taxa to be independent of their previous sorted position so that the order for any given combination of character input values is predictable.
 
### Added
 - Added a new [*Release notes*](ReleaseNotes.md) document to help knowledge-base developers move from one release of the Identikit to the latest release.
 - Added versioning to *Bisuits KB* template including a link to a YouTube video that explains how to update a knowledge-base to a new template (to pick up new macros etc).
 - Added media-dependent margins to *vis.html* (the 'test harness').
 - Added ability to include NBN maps (via NBN Atlas web services) in the *Full taxon details* visualisation and the *Full taxon details* dialog by adding a *TVK* column to the taxa worksheet of the knowledge-base.
 - Added ability for KB developers to test whether or not their media files are being found.
 - Added the ability for KB developers to specify a *novalue* value.
 - Knowledge-base developers can how specify value groups and reference the groups from the taxa worksheet.
 - Images hosted elsewhere on the web can now be referenced from the media worksheet.
  
### Fixed
 - Tooltip images that become 'orphaned' can now be removed by clicking on them.
 - Fixed resizing bug where visualisation was shorter than length of input control tabs.
 - Fixed bug whereby knowledge-base character called *Height* broke the visualisations (https://github.com/burkmarr/tombiovis/issues/13).
 - Fixed bug whereby URL generation from keys didn't always reflect currently specified character values (https://github.com/burkmarr/tombiovis/issues/14).
 - Fixed bug whereby ordinal and numeric character values not specified in values tab caused an error.
 - Fixed a bug with generation of view URLs on hosted sites (e.g. on Drupal pages).

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