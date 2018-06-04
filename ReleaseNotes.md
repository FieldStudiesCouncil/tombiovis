# Release notes for existing knoweldge-base developers
These notes are intended to help existing knowledge-base developers move from one version of the FSC Identikit to another. These notes were first released with version 1.7.0 of the Identikit and will be updated on each succeeding release.
## Release 1.7.0
Most of the significant changes to the Identikit with release 1.7.0 are architectural (i.e. 'under the hoo') in preparation for significant changes coming later in 2018 when we will produce a multi-access key that is 'mobile-first' and suitable for delivering ID resources that can be used in the field. Nevertheless there have been one or two significant changes in this release. Most changes are 'backwards-campatible' which means that knowledge-bases that were written for earlier releases will work unchanged with this new release. But if you want to capitalise on some of the improvements, you may need to make some changes as outlined below.

These notes are written from the point of view of a knowledge-base developer moving from version 1.6.0 to 1.7.0 of the framework, but the process should be pretty much the same if you are moving from an earlier version.

### Updating to release 1.7.0
The procedure for updating to a new release of the Identikit is the same as demonstrated in this video: http://www.fscbiodiversity.uk/fullscreen/tombiovis-upgrade. (The video was made when version 1.4.1 was released and was still referred to then as *the Framework*.)

If you encounter any problems doing this, email Rich Burkmar describing where you are coming unstuck: <r.burkmar@field-studies-council.org>


### Recommendataion to use Notepad++ to edit HTML
We provide *vis.html* as a kind of test harness that you can use to host the Identikit whilst you are developing and testing a knowledge-base. Previously we have recommended that you use a simple text editor such as Windows Notepad, to edit this (as shown in the video demonstrating updating a release installation). But as the Identikit matures, more options can be specified in the calling web page and editing with Notepad is increasingly difficult. For editing HTML files like these for Identikit, we are now recommending a more sophisticated editor (though still 'light-weight' and free) called *Notepad++*.

*Notepad++* is much more user-friendly for editing HTML than *Windows Notepad* – it will colour text and tags differently and use indentation to make the HTML much more readable. It makes it much less likely that you will make mistakes. You can download it here: https://notepad-plus-plus.org/download/v7.5.6.html.

We are also recommending this editor if you are creating HTML files to provide additional textual information for species in your knowledge-base. Previously we proposed that you could use an editor like *Microsoft Word* to create your text files and then use 'Save As...' to create HTML documents from these. This approach creates problems as describe in the section *3.4.4 HTML files to provide further information on taxa* of the document *Building a knowledge-base*. If you already have many HTML files created with Microsoft Word and you are not having any problems, then don't worry - all should be well. But be aware that this new version of the Identikit handles HTML files a little differently, so you will want to test your files when you've updated to the new release.

### Changes to *vis.html*
We've made a number of changes to the way Identikit initialisation options are handled. These are described in the document *Deploying your visualisations*. For the most part, the old ways of initialising things are still supported, but not recommended (i.e. they are *deprecated*). So the chances are that the copy if *vis.html* that you use to run the Identikit whilst developing and testing your knowlege-base will still work.

However, one change that you need likely want to incorporate is the addition of this line:

`<script src="https://cdnjs.cloudflare.com/ajax/libs/core-js/2.5.6/core.min.js"></script>`

This is the inclusion of a Javascript file which will help older browsers work with some new features of Javascript used by the new release of Identikit.

We strongly recommend that instead of trying to update your current test HTML page, you create a new one based on that supplied with the new release and modify this to reflect any configuration options you changed in your old copy - most importantly the path to your knowledge-base folder.

(And remember we recommend that you download and use Notepad++ to edit it.)

### Using the new version of the Excel knowledge-base
The Excel knowledge-base template (*Biscuits.xlsm*) has been updated to reflect the addition of new columns (e.g. the change from *Strictness* to *Latitude* on the *Characters* worksheet - see below) and changes to some of the macros.

In all likelihood, the new release will work just fine with your old knowledge-base. If you need to alter anything in your knowledge-base to take advantage of new features (e.g. adding a column to one of the worksheets), it will be easy for you to simply update your current knowledge-base spreadsheet. The difficulty is if you want to take advantage of changes to the macros. For example release 1.7.0 includes a fix to the macro which creates the *CSV* files to overcome some problems with the display non-standard (e.g. accented) characters. If you want to take advantage of that, you will need to update your knowedge-base.

It is easier to copy your knowledge-base worksheets into a new copy of the template that already includes the new macros than it is to copy the new macro code to your current knowledge-base. We've described how you can do that in this new video: https://youtu.be/6E7Z9xewNng											
### New media checking
adfs

### Including NBN maps
asdf

### New image handling
Including images from websites

### Novalue

### value groups










