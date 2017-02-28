# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

### Changed

### Added
 - New visualisation - circle pack key (vis 6) completed.
 - In test harness HTML the title is now replaces with the name of the knowledge-base and the footer by the knowledge-base citation.

### Fixed

### Removed

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